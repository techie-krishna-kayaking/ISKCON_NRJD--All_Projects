from pdf2image import convert_from_path
from PIL import Image
import os
import numpy as np


def skew_image(image, angle):
    """
    Skew the image by the given angle.

    Args:
        image (PIL.Image): The input image.
        angle (float): The angle by which to skew the image.

    Returns:
        PIL.Image: The skewed image.
    """
    width, height = image.size
    # Create an affine transformation matrix for skewing
    affine_matrix = (1, np.tan(np.radians(angle)), 0, 0, 1, 0)
    skewed_image = image.transform((width, height), Image.AFFINE, affine_matrix, resample=Image.BICUBIC)
    return skewed_image


def convert_to_black_and_white(image):
    """
    Convert the image to black and white.

    Args:
        image (PIL.Image): The input image.

    Returns:
        PIL.Image: The black and white image.
    """
    return image.convert('L')


def pdf_to_skewed_bw_png(pdf_path, output_folder, angle):
    """
    Convert each page of the PDF to a skewed black and white PNG image.

    Args:
        pdf_path (str): Path to the input PDF file.
        output_folder (str): Path to the folder where PNG images will be saved.
        angle (float): The angle by which to skew the images.

    Returns:
        None
    """
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Convert PDF to a list of PIL images
    images = convert_from_path(pdf_path)

    # Save each skewed black and white image as a PNG file
    for i, image in enumerate(images):
        # Skew the image
        skewed_image = skew_image(image, angle)
        # Convert to black and white
        bw_image = convert_to_black_and_white(skewed_image)
        output_path = os.path.join(output_folder, f'page_{i + 1}.png')
        bw_image.save(output_path, 'PNG')

    print(f"PDF conversion complete. Images saved in: {output_folder}")


def convert_all_pdfs_in_folder(input_folder, output_folder, angle):
    """
    Convert all PDF files in the input folder to skewed black and white PNG images and save them in the output folder.

    Args:
        input_folder (str): Path to the folder containing PDF files.
        output_folder (str): Path to the folder where PNG images will be saved.
        angle (float): The angle by which to skew the images.

    Returns:
        None
    """
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Iterate through all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(input_folder, filename)
            pdf_name = os.path.splitext(filename)[0]  # Get the PDF file name without extension
            pdf_output_folder = os.path.join(output_folder, pdf_name)

            # Convert the PDF to skewed black and white PNG images
            pdf_to_skewed_bw_png(pdf_path, pdf_output_folder, angle)


if __name__ == "__main__":
    # Path to the input folder containing PDF files
    input_dir = 'school/vpa/'

    # Path to the output folder where PNG images will be saved
    output_dir = 'school/vpa/'

    # The angle by which to skew the images
    skew_angle = 0  # Example skew angle in degrees

    # Convert all PDFs in the input folder
    convert_all_pdfs_in_folder(input_dir, output_dir, skew_angle)
