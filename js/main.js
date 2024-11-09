console.log("JavaScript file loaded successfully!");

d3.csv("data/GDP_annual_growth_NEW.csv")
    .then(function(data) {
        console.log("CSV file loaded successfully!", data);

        let reshapedData = [];
        
        let years = d3.range(2000, 2021);

        let top10Countries = [
            "United States", "China", "Japan", "Germany",
            "India", "United Kingdom", "France", "Italy",
            "Canada", "South Korea"
        ];

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

        console.log("Reshaped Data:", reshapedData);

        createVisualization(reshapedData);
    })
    .catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });

    function createVisualization(data) {
        // Set the dimensions and margins for the SVG
        const margin = { top: 50, right: 150, bottom: 50, left: 100 };
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
        const xScale = d3.scaleLinear()
            .domain([2000, 2020])
            .range([0, width]);
    
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.gdp_growth))
            .range([height, 0]);
    
        // Set up the x and y axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale);
    
        // Append x-axis to the SVG
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);
    
        // Append y-axis to the SVG
        svg.append("g")
            .call(yAxis);
    
        // Create a line generator function
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.gdp_growth));
    
        // Group the data by country
        const nestedData = d3.group(data, d => d.country);
    
        // Draw a line for each country
        svg.selectAll(".line")
            .data(nestedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", d => line(d[1]))
            .style("fill", "none")
            .style("stroke", (d, i) => d3.schemeCategory10[i % 10])
            .style("stroke-width", 1.5);
    
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
    }
    