<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'summary_data'       => $this->resource['summary_data'] ?? [],
            'payment_breakdown'  => $this->resource['payment_breakdown'] ?? [],
            'gross_sales'        => (float) ($this->resource['gross_sales'] ?? 0),
            'vatable_sales'      => (float) ($this->resource['vatable_sales'] ?? 0),
            'vat_amount'         => (float) ($this->resource['vat_amount'] ?? 0),
            'vat_exempt_sales'   => (float) ($this->resource['vat_exempt_sales'] ?? 0),
            'is_vat'             => (bool) ($this->resource['is_vat'] ?? true),
            'sc_discount'        => (float) ($this->resource['sc_discount'] ?? 0),
            'pwd_discount'       => (float) ($this->resource['pwd_discount'] ?? 0),
            'diplomat_discount'  => (float) ($this->resource['diplomat_discount'] ?? 0),
            'other_discount'     => (float) ($this->resource['other_discount'] ?? 0),
            'sc_pwd_discount'    => (float) ($this->resource['sc_pwd_discount'] ?? 0),
            'total_discounts'    => (float) ($this->resource['total_discounts'] ?? 0),
            'pre_discount_gross' => (float) ($this->resource['pre_discount_gross'] ?? 0),
            'total_void_amount'  => (float) ($this->resource['total_void_amount'] ?? 0),
            'total_senior_pax'   => (int) ($this->resource['total_senior_pax'] ?? 0),
            'total_pwd_pax'      => (int) ($this->resource['total_pwd_pax'] ?? 0),
            'total_diplomat_pax' => (int) ($this->resource['total_diplomat_pax'] ?? 0),
            'from_date'          => $this->resource['from_date'] ?? null,
            'to_date'            => $this->resource['to_date'] ?? null,
        ];
    }
}
