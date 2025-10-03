/**
 * Enhanced CSV file loader with error handling
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.requiredColumns] - Column names that must exist
 * @param {Function} [options.transform] - Function to transform each row
 * @returns {Promise<Array<Object>>} Parsed data as array of objects
 */
async function loadCSV(filePath, options = {}) {
    try {
        // Fetch the file
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Failed to load file: ${filePath} (${response.status} ${response.statusText})`);
        }
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error(`File contains insufficient data: ${filePath}`);
        }
        
        // Parse headers, handling quoted values
        const headers = parseCSVLine(lines[0]);
        
        // Check for required columns if specified
        if (options.requiredColumns) {
            const missingColumns = options.requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
            }
        }
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = parseCSVLine(lines[i]);
                
                if (values.length !== headers.length) {
                    console.warn(`Row ${i} has ${values.length} values, expected ${headers.length}. Skipping.`);
                    continue;
                }
                
                const row = {};
                headers.forEach((header, idx) => {
                    row[header.trim()] = values[idx].trim();
                });
                
                // Apply transformation if provided
                const processedRow = options.transform ? options.transform(row) : row;
                if (processedRow) {
                    data.push(processedRow);
                }
            } catch (rowError) {
                console.warn(`Error parsing row ${i}: ${rowError.message}. Skipping.`);
            }
        }
        
        if (data.length === 0) {
            throw new Error(`No valid data rows found in file: ${filePath}`);
        }
        
        return data;
    } catch (error) {
        console.error(`Error loading CSV: ${error.message}`);
        throw error;
    }
}

/**
 * Parse a CSV line, handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // Add the last value
    values.push(currentValue);
    
    // Remove quotes from values
    return values.map(val => val.replace(/^"(.*)"$/, '$1'));
}

// Data loading functions for each chart
async function getScatterPlotData() {
    return await loadCSV('Ex5/Ex5_TV_energy.csv', {
        requiredColumns: ['brand', 'screen_tech', 'screensize', 'energy_consumpt', 'star2'],
        transform: row => ({
            brand: row.brand,
            screenType: row.screen_tech,
            screenSize: parseFloat(row.screensize),
            energyConsumption: parseFloat(row.energy_consumpt),
            starRating: parseFloat(row.star2)
        })
    });
}

async function getDonutChartData() {
    return await loadCSV('Ex5/Ex5_TV_energy_Allsizes_byScreenType.csv', {
        requiredColumns: ['Screen_Tech', 'Mean(Labelled energy consumption (kWh/year))'],
        transform: row => ({
            screenType: row.Screen_Tech,
            energyConsumption: parseFloat(row["Mean(Labelled energy consumption (kWh/year))"])
        })
    });
}

async function getBarChartData() {
    return await loadCSV('Ex5/Ex5_TV_energy_55inchtv_byScreenType.csv', {
        requiredColumns: ['Screen_Tech', 'Mean(Labelled energy consumption (kWh/year))'],
        transform: row => ({
            screenType: row.Screen_Tech,
            energyConsumption: parseFloat(row["Mean(Labelled energy consumption (kWh/year))"])
        })
    });
}

async function getLineGraphData() {
    return await loadCSV('Ex5/Ex5_ARE_Spot_Prices_cleaned.csv', {
        transform: row => {
            // Handle the specific structure of this file
            const year = row.Year;
            const price = parseFloat(row["Average Price (notTas-Snowy)"]);
            
            if (!isNaN(year) && !isNaN(price)) {
                return {
                    date: new Date(parseInt(year), 0, 1),
                    price: price
                };
            }
            return null; // Will be filtered out
        }
    });
}