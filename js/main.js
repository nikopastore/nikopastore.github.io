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

    // Draw a line for each country
    const lines = svg.selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d))
        .style("fill", "none")
        .style("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .style("stroke-width", 1.5);

    // Create a tooltip (invisible initially)
    const tooltip = d3.select("#tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("font-size", "12px");

    // Add hover interaction
    lines
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke-width", 2.5); // Increase stroke width to indicate highlight

            // Get the current x-axis minimum value
            const xMin = +d3.select("#xMin").property("value");

            // Get the nearest data point to the mouse
            const mouseYear = Math.round(xScale.invert(event.offsetX - margin.left));
            const dataPoint = d.find(point => point.year === mouseYear);

            // Find the starting data point for the current visible range
            const startPoint = d.find(point => point.year === xMin);

            if (dataPoint && startPoint) {
                // Calculate the total percentage change from the starting year
                const totalChange = dataPoint.gdp_growth - startPoint.gdp_growth;

                tooltip.style("visibility", "visible")
                    .html(`<strong>Country:</strong> ${d[0].country}<br><strong>Year:</strong> ${dataPoint.year}<br><strong>Total GDP Growth from ${xMin}:</strong> ${totalChange.toFixed(2)}%`);
            }
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("stroke-width", 1.5); // Reset stroke width
            tooltip.style("visibility", "hidden");
        });

    // Add update functionality
    d3.select("#xMin").on("input", updateChart);
    d3.select("#xMax").on("input", updateChart);
    d3.select("#yMin").on("input", updateChart);
    d3.select("#yMax").on("input", updateChart);

    // Reset button
    d3.select("#resetButton").on("click", function() {
        d3.select("#xMin").property("value", 2000);
        d3.select("#xMax").property("value", 2020);
        d3.select("#yMin").property("value", d3.min(data.flat(), d => d.gdp_growth));
        d3.select("#yMax").property("value", d3.max(data.flat(), d => d.gdp_growth));
        updateChart();
    });

    function updateChart() {
        // Get current slider values
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

        // Normalize data based on new xMin
        const normalizedData = data.map(countryData => {
            const startValue = countryData.find(point => point.year === xMin)?.gdp_growth || 0;
            return countryData.map(point => ({
                ...point,
                gdp_growth: point.gdp_growth - startValue
            }));
        });

        // Update line paths
        lines.data(normalizedData)
            .attr("d", d => line(d));
    }

    // Initial call to ensure everything is displayed
    updateChart();
}
