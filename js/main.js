// Debugging to ensure the JavaScript file is linked
console.log("JavaScript file loaded successfully!");

// Load the CSV file
d3.csv("data/GDP_annual_growth_NEW.csv")
    .then(function(data) {
        console.log("CSV file loaded successfully!", data);

        // Reshape the data into a format suitable for D3.js
        let reshapedData = [];
        
        // Define the years of interest (from 2000 to 2020)
        let years = d3.range(2000, 2021);

        // Define the top 10 countries (exact names as in the CSV)
        let top10Countries = [
            "United States", "China", "Japan", "Germany",
            "India", "United Kingdom", "France", "Italy",
            "Canada", "South Korea"
        ];

        // Iterate through each row of the CSV to create reshaped data
        data.forEach(d => {
            if (top10Countries.includes(d["Country Name"])) {
                let countryData = [];
                years.forEach(year => {
                    if (d[year] !== undefined && d[year] !== "") {
                        countryData.push({
                            country: d["Country Name"],
                            year: +year,
                            gdp_growth: +d[year]
                        });
                    }
                });

                // Normalize the data to start from 0 in the year 2000
                if (countryData.length > 0) {
                    const baseValue = countryData.find(point => point.year === 2000).gdp_growth;
                    countryData.forEach(point => {
                        point.gdp_growth = point.gdp_growth - baseValue;
                    });
                    reshapedData.push(countryData);
                }
            }
        });

        // Log reshaped data to check correctness
        console.log("Reshaped Data:", reshapedData);

        // Proceed to create the visualization
        createVisualization(reshapedData);
    })
    .catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });

// Function to create the visualization
function createVisualization(data) {
    // Set the dimensions and margins for the SVG
    const margin = { top: 50, right: 250, bottom: 100, left: 100 }; // Increased right margin for legend space
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG container
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for the x and y axes
    let xScale = d3.scaleLinear()
        .domain([2000, 2020])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain([d3.min(data.flat(), d => d.gdp_growth), d3.max(data.flat(), d => d.gdp_growth)])
        .range([height, 0]);

    // Set up the x and y axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d}%`);

    // Append x-axis to the SVG
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    // Append y-axis to the SVG
    const yAxisGroup = svg.append("g")
        .call(yAxis);

    // Create a line generator function
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.gdp_growth));

    // Draw a line for each country and apply the clipping path
    const linesGroup = svg.append("g")
        .attr("clip-path", "url(#clip)")  // Apply the clip path

    const lines = linesGroup.selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d))
        .style("fill", "none")
        .style("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .style("stroke-width", 1.5)
        .attr("id", d => d[0].country.replace(/\s+/g, '_'));  // Assign a unique ID to each line

    // Create a legend with checkboxes for each country
    const legendContainer = d3.select("#visualization-container").append("div")
        .attr("class", "legend-container");

    data.forEach((countryData, i) => {
        const countryName = countryData[0].country;

        // Create a container for each checkbox and label
        const legendItem = legendContainer.append("div")
            .attr("class", "legend-item");

        // Add the checkbox
        legendItem.append("input")
            .attr("type", "checkbox")
            .attr("id", countryName.replace(/\s+/g, '_'))
            .attr("checked", true)  // Initially, all lines are visible
            .on("change", function() {
                const isChecked = d3.select(this).property("checked");
                const lineId = `#${countryName.replace(/\s+/g, '_')}`;
                if (isChecked) {
                    d3.select(lineId).style("display", null);
                } else {
                    d3.select(lineId).style("display", "none");
                }
            });

        // Add the label next to the checkbox
        legendItem.append("label")
            .attr("for", countryName.replace(/\s+/g, '_'))
            .text(countryName)
            .style("margin-left", "8px")
            .style("color", d3.schemeCategory10[i % 10]); // Match the color of the line
    });

    // Tooltip to show information
    const tooltip = d3.select("#tooltip");

    lines.on("mouseover", function (event, d) {
            d3.select(this)
                .style("stroke-width", 3)
                .style("stroke", "orange");

            tooltip.style("visibility", "visible")
                .html(`<strong>Country:</strong> ${d[0].country}<br><strong>Year:</strong> ${d[d.length - 1].year}<br><strong>GDP Growth:</strong> ${d[d.length - 1].gdp_growth.toFixed(2)}%`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .style("stroke-width", 1.5)
                .style("stroke", d3.schemeCategory10[data.indexOf(d) % 10]); // Revert to the original color
            tooltip.style("visibility", "hidden");
        });
}
