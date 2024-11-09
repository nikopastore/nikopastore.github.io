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
                reshapedData.push(countryData);
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
    const margin = { top: 50, right: 150, bottom: 100, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG container
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a clip path to ensure lines do not exceed the chart area
    svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

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

    // Group the data by country
    const nestedData = d3.group(data.flat(), d => d.country);

    // Create the tooltip
    const tooltip = d3.select("#tooltip");

    // Draw a line for each country and apply the clipping path
    let linesGroup = svg.append("g")
        .attr("clip-path", "url(#clip)");  // Apply the clip path

    let lines = linesGroup.selectAll(".line")
        .data(nestedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .style("fill", "none")
        .style("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .style("stroke-width", 1.5)
        .each(function (d, i) {
            // Store the original color in the data for later use
            d.originalColor = d3.schemeCategory10[i % 10];
        });

    // Add a legend for the lines, placing it outside of the clipping path
    const legend = svg.selectAll(".legend")
        .data(nestedData.keys())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width + 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", (d, i) => d3.schemeCategory10[i % 10]);

    legend.append("text")
        .attr("x", width + 35)
        .attr("y", 5)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);

    // Update the chart when sliders are used
    d3.select("#xMin").on("input", updateChart);
    d3.select("#xMax").on("input", updateChart);
    d3.select("#yMin").on("input", updateChart);
    d3.select("#yMax").on("input", updateChart);

    // Add reset button functionality
    d3.select("#resetButton").on("click", function() {
        d3.select("#xMin").property("value", 2000);
        d3.select("#xMax").property("value", 2020);
        d3.select("#yMin").property("value", d3.min(data.flat(), d => d.gdp_growth));
        d3.select("#yMax").property("value", d3.max(data.flat(), d => d.gdp_growth));
        updateChart();
    });

    function updateChart() {
        // Get slider values
        const xMin = +d3.select("#xMin").property("value");
        const xMax = +d3.select("#xMax").property("value");
        const yMin = +d3.select("#yMin").property("value");
        const yMax = +d3.select("#yMax").property("value");

        // Normalize data based on xMin
        let normalizedData = data.map(countryData => {
            let startValue = countryData.find(point => point.year === xMin)?.gdp_growth || 0;
            return countryData.map(point => ({
                ...point,
                gdp_growth: point.gdp_growth - startValue
            }));
        });

        // Update y-axis domain based on new normalized data
        yScale.domain([yMin, yMax]);

        // Update x-axis domain
        xScale.domain([xMin, xMax]);

        // Update axes
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Update line paths with normalized data
        lines.data(normalizedData.flat())
            .attr("d", d => line(d));
    }
}
