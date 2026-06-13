# pip install pytesseract pillow opencv-python-headless numpy pandas pymupdf

import pytesseract
from PIL import Image
import cv2
import numpy as np
import os
import pandas as pd
import fitz  # PyMuPDF
import io  # Import io module

# Path to the PDF file
pdf_path = '/Users/kkrishna/PycharmProjects/OCROMR/OCR/ocr2-working-jun-2024/pdf/pdf1.pdf'
output_csv = '/Users/kkrishna/PycharmProjects/OCROMR/OCR/ocr2-working-jun-2024/output.csv'

# Function to check and correct image orientation
def correct_orientation(image):
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        d = pytesseract.image_to_osd(gray, output_type=pytesseract.Output.DICT)
        rotation = d.get('rotate', 0)
        if rotation != 0:
            image = Image.fromarray(cv2.rotate(image, rotation))
    except pytesseract.TesseractError as e:
        print(f"Error during orientation detection: {e}")
    return image

# List to hold the text from each image
texts = []

# Open the PDF file
doc = fitz.open(pdf_path)
for i in range(len(doc)):
    page = doc.load_page(i)
    images = page.get_images(full=True)
    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image = Image.open(io.BytesIO(image_bytes))  # Use io.BytesIO to handle byte stream

        # Set default DPI if needed
        if image.info.get('dpi') is None:
            image.info['dpi'] = (70, 70)

        # Convert the image to a NumPy array
        image_np = np.array(image)

        # Correct image orientation
        corrected_image = correct_orientation(image_np)

        # Convert the image to grayscale
        gray = cv2.cvtColor(np.array(corrected_image), cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a black and white image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        # Convert back to PIL image for OCR
        preprocessed_img = Image.fromarray(binary)

        # Perform OCR with specific language and custom configurations
        custom_config = r'--oem 3 --psm 6'
        try:
            text = pytesseract.image_to_string(preprocessed_img, config=custom_config, lang='eng')
        except pytesseract.TesseractError as e:
            print(f"Error during OCR processing: {e}")
            text = ""

        # Append the recognized text to the list
        filename = f"page_{i+1}_img_{img_index+1}.jpeg"
        texts.append([filename, text])

# Create a DataFrame from the texts list
df = pd.DataFrame(texts, columns=['Filename', 'Recognized Text'])

# Save the DataFrame to a CSV file
df.to_csv(output_csv, index=False)

print(f"OCR processing complete. Output saved to {output_csv}")
