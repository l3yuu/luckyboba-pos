from PIL import Image
import os

img_path = r'c:\Users\binas\VSCODE\OJT\luckyboba-pos\frontend\public\lucky.jpg'
output_path = r'c:\Users\binas\VSCODE\OJT\luckyboba-pos\desktop-shell\lucky.ico'

if os.path.exists(img_path):
    img = Image.open(img_path)
    # Windows icons usually look best with multiple sizes
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(output_path, format='ICO', sizes=icon_sizes)
    print(f"Successfully created: {output_path}")
else:
    print(f"Error: Could not find {img_path}")
