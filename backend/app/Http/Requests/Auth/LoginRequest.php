<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Http\Exceptions\HttpResponseException; // <-- Added
use Illuminate\Contracts\Validation\Validator;       // <-- Added

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Prevent Laravel from throwing a 422 if the fields are empty.
     * Return a 200 OK with success => false instead.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first()
        ], 200));
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            // Prevent the 422 ValidationException. Send a 200 OK instead.
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => __('auth.failed') // Usually "These credentials do not match..."
            ], 200));
        }
        if (Auth::user()->status === 'INACTIVE') {
            Auth::logout(); // immediately clear the session so no access leaks through

            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact your administrator.'
            ], 200));
        }
        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ])
        ], 200));
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }
}