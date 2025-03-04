# import requests
# import PyPDF2
# import re
# import json
# import os

# # Get the directory where the script is located
# script_dir = os.path.dirname(os.path.abspath(__file__))

# # Define the PDF file path in the same directory as the script
# pdf_path = os.path.join(script_dir, 'campusmap.pdf')

# # Download the PDF file
# url = 'https://www.purdue.edu/campus-map/graphics/campusmap.pdf'
# pdf_response = requests.get(url)
# with open(pdf_path, 'wb') as file:
#     file.write(pdf_response.content)

# # Function to extract text from the first page of the PDF
# def extract_text_from_first_page(pdf_path):
#     with open(pdf_path, 'rb') as file:
#         reader = PyPDF2.PdfReader(file)
#         first_page = reader.pages[0]
#         text = first_page.extract_text()
#     return text

# # Function to process the text and generate location JSON
# def extract_locations_from_text(text):
#     # Split the text into lines
#     lines = text.split('\n')
#     location_data = []

#     # Regular expression to match building information
#     building_regex = re.compile(r'([A-Za-z0-9\-]+)\s([A-Za-z\s\(\)]+)\s+[A-H][0-9]+')

#     for line in lines:
#         match = building_regex.search(line)
#         if match:
#             abbrev = match.group(1)
#             full_name = match.group(2).strip()
#             maps_url = f'https://www.google.com/maps/search/{abbrev}+Purdue+University'
            
#             # Create JSON object for each location
#             location_data.append({
#                 'short_name': abbrev,
#                 'full_name': full_name,
#                 'maps_query': maps_url
#             })

#     return location_data

# # Extract text from the first page of the PDF
# text = extract_text_from_first_page(pdf_path)

# # Extract location data
# locations = extract_locations_from_text(text)

# # Output the location data as a JSON string
# json_output = json.dumps(locations, indent=4)

# # Save the JSON to a file in the same directory as the script
# output_path = os.path.join(script_dir, 'locations.json')
# with open(output_path, 'w') as output_file:
#     output_file.write(json_output)

# print(f'JSON data saved to {output_path}')
