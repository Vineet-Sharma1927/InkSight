import csv
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from rapidfuzz import process, fuzz

# For a real application, you would use pdfplumber or PyMuPDF to extract tables from PDF
# Here we'll use the CSV file as a mock for PDF data

class ResponseAnalyzer:
    def __init__(self, data_dir: str = None):
        """Initialize the response analyzer with data directory path."""
        if data_dir is None:
            # Use default relative path if not provided
            current_dir = Path(__file__).parent.parent
            data_dir = current_dir / 'data'
        
        self.data_dir = Path(data_dir)
        self.response_data: Dict[int, List[Dict[str, str]]] = {}
        self.load_data()
    
    def load_data(self) -> None:
        """Load response data from CSV file."""
        sample_data_path = self.data_dir / 'sample_table.csv'
        
        if not sample_data_path.exists():
            raise FileNotFoundError(f"Data file not found: {sample_data_path}")
        
        # Read data from CSV
        with open(sample_data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                image_id = int(row['image_id'])
                
                if image_id not in self.response_data:
                    self.response_data[image_id] = []
                
                self.response_data[image_id].append({
                    'response_text': row['response_text'].lower(),
                    'location': row['location'],
                    'fq': row['fq']
                })
    
    def analyze_response(self, response_text: str, image_id: int) -> Optional[Dict[str, str]]:
        """
        Analyze a response using fuzzy matching.
        
        Args:
            response_text: The text response to analyze
            image_id: The ID of the image being analyzed
            
        Returns:
            Dict with location and fq values, or None if no match found
        """
        if image_id not in self.response_data:
            return None
        
        # Normalize the input
        response_text = response_text.lower().strip()
        
        # Get all response texts for this image ID
        candidates = [item['response_text'] for item in self.response_data[image_id]]
        
        # Find the best match using fuzzy matching
        best_match, score, _ = process.extractOne(
            response_text, 
            candidates,
            scorer=fuzz.token_set_ratio  # Use token set for better partial matching
        )
        
        # Only accept matches with decent scores
        if score < 70:
            return None
            
        # Find the corresponding data for the best match
        for item in self.response_data[image_id]:
            if item['response_text'] == best_match:
                return {
                    'location': item['location'],
                    'fq': item['fq']
                }
        
        return None
    
    def get_tables_info(self) -> List[Dict]:
        """
        Get information about all tables (image IDs) in the data.
        
        Returns:
            List of dictionaries with table information
        """
        tables_info = []
        
        for image_id, data in self.response_data.items():
            tables_info.append({
                'image_id': image_id,
                'table_name': f"Image {image_id}",
                'num_rows': len(data)
            })
        
        return tables_info
