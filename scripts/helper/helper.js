function parseTable(elTable) {

    // Initialize an object to hold parameter-value pairs
    var paramMap = {};

    // Loop through the table rows
    for (var i = 0, row; row = elTable.rows[i]; i++) {
        // Get the parameter name from the first column
        var paramName = row.cells[0].textContent.trim();
        // Get the parameter value from the second column
        var paramValue = row.cells[1].textContent.trim();

        // Store the parameter name and value in the paramMap object
        paramMap[paramName] = paramValue;
    }

    // Return a function that allows fetching values by parameter name
    return function(paramName) {
        return paramMap[paramName];
    };
}
function parseTableToJSON(table) {

    // Initialize an array to hold the row data
    var tableData = [];

    // Loop through the table rows
    for (var i = 0, row; row = table.rows[i]; i++) {
        // Initialize an array to hold the cell data for the current row
        var rowData = [];

        // Loop through the cells in the current row
        for (var j = 0, cell; cell = row.cells[j]; j++) {
            // Check if the cell contains a picture element
            var picture = cell.querySelector('picture img');

            if (picture) {
                // If a picture element is found, get the src attribute of the img element
                rowData.push(picture.src);
            } else {
                // Otherwise, get the cell text content and trim any whitespace
                rowData.push(cell.textContent.trim());
            }

            if(j === 1) {
                // second cell may contain href
                const isAnchor = cell.querySelector('a');
                const linkPath  = isAnchor ? isAnchor.getAttribute('href') : "#"
                rowData.push(linkPath)
            }
        }

        // Add the row data array to the table data array
        tableData.push(rowData);
    }

    // Convert the table data array to JSON
    return JSON.parse(JSON.stringify(tableData));
}

export {
    parseTable,
    parseTableToJSON
}
