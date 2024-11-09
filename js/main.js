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
    const margin = { top: 50, right: 50, bottom: 100, left: 100 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG container
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Clip path to prevent lines from extending outside chart bounds
    svg.append("defs").append("clipPath")
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

    // Draw a line for each country and apply the clipping path
    const linesGroup = svg.append("g")
        .attr("clip-path", "url(#clip)");

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
            tooltip.style("top", `${event.clientY + window.scrollY - 20}px`)
                .style("left", `${event.clientX + 20}px`);
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("stroke-width", 1.5)
                .style("stroke", d3.schemeCategory10[data.indexOf(d) % 10]); // Revert to original color
            tooltip.style("visibility", "hidden");
        });

    // Set up filters for interaction
    d3.select("#yearMin").on("input", updateChart);
    d3.select("#yearMax").on("input", updateChart);
    d3.select("#gdpMin").on("input", updateChart);
    d3.select("#gdpMax").on("input", updateChart);

    function updateChart() {
        const yearMin = +d3.select("#yearMin").property("value");
        const yearMax = +d3.select("#yearMax").property("value");
        const gdpMin = +d3.select("#gdpMin").property("value");
        const gdpMax = +d3.select("#gdpMax").property("value");

        // Update scales
        xScale.domain([yearMin, yearMax]);
        yScale.domain([gdpMin, gdpMax]);

        // Update axes
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Update lines
        lines.attr("d", d => line(d));
    }
}
