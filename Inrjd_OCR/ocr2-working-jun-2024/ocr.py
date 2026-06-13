"""
#### INSTALLS ---
# pip install opencv-python pytesseract pandas
# brew install tesseract-lang-eng

###### BAS COMMANDS
# ls /opt/homebrew/share/tessdata/eng.traineddata
# brew install tesseract-lang
# tesseract --version
# tesseract --list-langs


### --- MAIN PIP INSTALLS
# pip install pytesseract pillow opencv-python pandas


"""

import pytesseract
from PIL import Image
import cv2
import numpy as np
import os
import pandas as pd

# Path to the directory containing images
image_dir = '/Users/kkrishna/PycharmProjects/OCROMR/OCR/ocr2-working-jun-2024/img'
output_csv = '/Users/kkrishna/PycharmProjects/OCROMR/OCR/ocr2-working-jun-2024/output.csv'

# List to hold the text from each image
texts = []

# Iterate over each file in the image directory
for filename in os.listdir(image_dir):
    if filename.endswith(".jpeg") or filename.endswith(".jpg") or filename.endswith(".png"):
        image_path = os.path.join(image_dir, filename)

        # Open the image using PIL
        img = Image.open(image_path)

        # Convert the image to grayscale
        gray = cv2.cvtColor(np.array(img), cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a black and white image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        # Convert back to PIL image for OCR
        preprocessed_img = Image.fromarray(binary)

        # Perform OCR with specific language and custom configurations
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(preprocessed_img, config=custom_config, lang='eng')

        # Append the recognized text to the list
        texts.append([filename, text])

# Create a DataFrame from the texts list
df = pd.DataFrame(texts, columns=['Filename', 'Recognized Text'])

# Save the DataFrame to a CSV file
df.to_csv(output_csv, index=False)

print(f"OCR processing complete. Output saved to {output_csv}")
