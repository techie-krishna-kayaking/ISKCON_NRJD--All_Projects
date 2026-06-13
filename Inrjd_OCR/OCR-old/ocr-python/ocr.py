import cv2
import pytesseract
import easyocr
import pandas as pd
import os


def extract_form_data(image_path):
    """
    Extracts printed and handwritten text from a form image.

    Args:
        image_path (str): Path to the form image.

    Returns:
        dict: A dictionary containing extracted printed and handwritten text.
    """

    # Preprocessing
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # Printed Text Extraction
    printed_text = pytesseract.image_to_string(thresh, config='--psm 6')

    # Handwritten Text Extraction
    reader = easyocr.Reader(['en'])  # For other languages, adjust accordingly
    results = reader.readtext(thresh)
    handwritten_text = ' '.join([r[1] for r in results])

    return {'printed_text': printed_text, 'handwritten_text': handwritten_text}


def process_images(image_folder, output_file, insecure=False):
    """
    Processes all images from a folder using OCR and saves extracted data.

    Args:
        image_folder (str): Path to the folder containing form images.
        output_file (str): Path and filename for the output CSV or Excel file.
    """

    data = []
    for filename in os.listdir(image_folder):
        if filename.endswith((".jpg", ".jpeg", ".png")):
            image_path = os.path.join(image_folder, filename)
            extracted_data = extract_form_data(image_path)
            data.append(extracted_data)

    df = pd.DataFrame(data)  # Create DataFrame from extracted data
    df.to_csv(output_file, index=False)  # Save as CSV (change to to_excel() for Excel)


# Example usage
image_folder = "/Users/kkrishna/PycharmProjects/OCR & OMR/OCR/ocr-python/images"
output_file = "/Users/kkrishna/PycharmProjects/OCR & OMR/OCR/ocr-python/result/extracted_data.csv"  # Change to '.xlsx' for Excel


process_images(image_folder, output_file, insecure=True)


