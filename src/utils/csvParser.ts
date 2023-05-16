// utils/csvParser.js
import Papa from 'papaparse';

export const parseCSV = (file: File) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Set to true if the CSV has headers
      complete: (results) => {
        resolve(results.data); // Resolve with the parsed data
      },
      error: (error) => {
        reject(error); // Reject with the parsing error
      },
    });
  });
};
