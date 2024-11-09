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
                    reshapedData.push(...countryData);
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
        .domain([d3.min(data, d => d.gdp_growth), d3.max(data, d => d.gdp_growth)])
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
    const nestedData = d3.group(data, d => d.country);

    // Create the tooltip
    const tooltip = d3.select("#tooltip");

    // Draw a line for each country and apply the clipping path
    const lines = svg.append("g")
        .attr("clip-path", "url(#clip)")  // Apply the clip path
        .selectAll(".line")
        .data(nestedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d[1]))
        .style("fill", "none")
        .style("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .style("stroke-width", 1.5)
        .each(function (d, i) {
            // Store the original color in the data for later use
            d.originalColor = d3.schemeCategory10[i % 10];
        })
        .on("mouseover", function (event, d) {
            d3.select(this)
                .style("stroke-width", 3)
                .style("stroke", "orange");

            // Get the current x-axis minimum value
            const xMin = +d3.select("#xMin").property("value");

            // Get the nearest data point to the mouse
            const mouseYear = Math.round(xScale.invert(event.offsetX - margin.left));
            const dataPoint = d[1].find(point => point.year === mouseYear);

            // Find the starting data point for the current visible range
            const startPoint = d[1].find(point => point.year === xMin);

            if (dataPoint && startPoint) {
                // Calculate the total percentage change from the starting year
                const totalChange = dataPoint.gdp_growth - startPoint.gdp_growth;

                tooltip.style("visibility", "visible")
                    .html(`<strong>Country:</strong> ${d[0]}<br><strong>Year:</strong> ${dataPoint.year}<br><strong>Total GDP Growth from ${xMin}:</strong> ${totalChange.toFixed(2)}%`);
            }
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            if (!d.isPinned) {
                d3.select(this)
                    .style("stroke-width", 1.5)
                    .style("stroke", d.originalColor);
            }
            tooltip.style("visibility", "hidden");
        })
        .on("click", function (event, d) {
            d.isPinned = !d.isPinned;
            if (d.isPinned) {
                d3.select(this).style("stroke-width", 3).style("stroke", "blue");
            } else {
                d3.select(this).style("stroke-width", 1.5).style("stroke", d.originalColor);
            }
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
        d3.select("#yMin").property("value", d3.min(data, d => d.gdp_growth));
        d3.select("#yMax").property("value", d3.max(data, d => d.gdp_growth));
        updateChart();
    });

    function updateChart() {
        // Get slider values
        const xMin = +d3.select("#xMin").property("value");
        const xMax = +d3.select("#xMax").property("value");
        const yMin = +d3.select("#yMin").property("value");
        const yMax = +d3.select("#yMax").property("value");

        // Update domains
        xScale.domain([xMin, xMax]);
        yScale.domain([yMin, yMax]);

        // Update axes
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Update line paths
        lines.attr("d", d => line(d[1]));
    }
}
