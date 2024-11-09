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

        // Iterate through each row of the CSV
        data.forEach(d => {
            if (top10Countries.includes(d["Country Name"])) {
                years.forEach(year => {
                    if (d[year] !== undefined && d[year] !== "") {
                        reshapedData.push({
                            country: d["Country Name"],
                            year: +year,
                            gdp_growth: +d[year]
                        });
                    }
                });
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

    // Set up scales for the x and y axes
    let xScale = d3.scaleLinear()
        .domain([2000, 2020])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.gdp_growth))
        .range([height, 0]);

    // Set up the x and y axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

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

    // Draw a line for each country
    const lines = svg.selectAll(".line")
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

            tooltip.style("visibility", "visible")
                .html(`<strong>Country:</strong> ${d[0]}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .style("stroke-width", 1.5)
                .style("stroke", d.originalColor);

            tooltip.style("visibility", "hidden");
        });

    // Add a legend for the lines
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

    // Add brush for the x-axis (time filter)
    const brushX = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushedX);

    svg.append("g")
        .attr("class", "brush-x")
        .call(brushX);

    // Add brush for the y-axis (GDP filter)
    const brushY = d3.brushY()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushedY);

    svg.append("g")
        .attr("class", "brush-y")
        .call(brushY);

    // Function to handle brushing on the x-axis
    function brushedX(event) {
        if (event.selection) {
            const [x0, x1] = event.selection.map(xScale.invert);
            xScale.domain([x0, x1]);
            updateChart();
        }
    }

    // Function to handle brushing on the y-axis
    function brushedY(event) {
        if (event.selection) {
            const [y0, y1] = event.selection.map(yScale.invert);
            yScale.domain([y1, y0]); // Reverse order since y-axis goes from bottom to top
            updateChart();
        }
    }

    // Function to update the chart after brushing
    function updateChart() {
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        lines.attr("d", d => line(d[1]));
    }
}
