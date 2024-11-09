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

                if (countryData.length > 0) {
                    const baseValue = countryData.find(point => point.year === 2000).gdp_growth;
                    countryData.forEach(point => {
                        point.gdp_growth = point.gdp_growth - baseValue;
                    });
                    reshapedData.push(countryData);
                }
            }
        });

        console.log("Reshaped Data:", reshapedData);

        createVisualization(reshapedData);
    })
    .catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });

function createVisualization(data) {
    const margin = { top: 50, right: 200, bottom: 100, left: 100 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    let xScale = d3.scaleLinear()
        .domain([2000, 2020])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain([d3.min(data.flat(), d => d.gdp_growth), d3.max(data.flat(), d => d.gdp_growth)])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d}%`);

    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    const yAxisGroup = svg.append("g")
        .call(yAxis);

    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.gdp_growth));

    const linesGroup = svg.append("g")
        .attr("clip-path", "url(#clip)");

    const lines = linesGroup.selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d))
        .style("fill", "none")
        .style("stroke", (d, i) => {
            const color = d3.schemeCategory10[i % 10];
            d.originalColor = color;
            return color;
        })
        .style("stroke-width", 1.5)
        .attr("id", d => d[0].country.replace(/\s+/g, '_'));

    const tooltipGroup = svg.append("g")
        .attr("class", "tooltip-group")
        .style("display", "none");

    const tooltipBox = tooltipGroup.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 150)
        .attr("height", 60)
        .attr("fill", "#ffffff")
        .attr("stroke", "#cccccc")
        .attr("rx", 4)
        .attr("ry", 4)
        .style("pointer-events", "none");

    const tooltipText = tooltipGroup.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("fill", "#333")
        .style("font-size", "12px");

    lines.on("mouseover", function (event, d) {
            d3.select(this)
                .style("stroke-width", 3)
                .style("stroke", "orange");

            tooltipGroup.style("display", null)
                .raise();

            tooltipText.text(`Country: ${d[0].country}`);
            tooltipText.append("tspan")
                .attr("x", 10)
                .attr("dy", 20)
                .text(`Year: ${d[d.length - 1].year}`);
            tooltipText.append("tspan")
                .attr("x", 10)
                .attr("dy", 20)
                .text(`GDP Growth: ${d[d.length - 1].gdp_growth.toFixed(2)}%`);
        })
        .on("mousemove", function (event) {
            tooltipGroup.attr("transform", `translate(${event.pageX - margin.left - 160},${event.pageY - margin.top - 100})`);
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .style("stroke-width", 1.5)
                .style("stroke", d.originalColor);

            tooltipGroup.style("display", "none");
        });

    const checkboxContainer = d3.select("#legend-container");

    data.forEach((d, i) => {
        const countryName = d[0].country;

        const checkbox = checkboxContainer.append("div")
            .attr("class", "checkbox-item");

        checkbox.append("input")
            .attr("type", "checkbox")
            .attr("id", `checkbox-${i}`)
            .attr("checked", true)
            .on("change", function () {
                const lineId = `#${countryName.replace(/\s+/g, '_')}`;
                d3.select(lineId).style("display", this.checked ? null : "none");
            });

        checkbox.append("label")
            .attr("for", `checkbox-${i}`)
            .text(countryName);
    });

    d3.select("#yearMin").on("input", updateChart);
    d3.select("#yearMax").on("input", updateChart);
    d3.select("#gdpMin").on("input", updateChart);
    d3.select("#gdpMax").on("input", updateChart);

    function updateChart() {
        const yearMin = +d3.select("#yearMin").property("value");
        const yearMax = +d3.select("#yearMax").property("value");
        const gdpMin = +d3.select("#gdpMin").property("value");
        const gdpMax = +d3.select("#gdpMax").property("value");

        xScale.domain([yearMin, yearMax]);
        yScale.domain([gdpMin, gdpMax]);

        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        lines.attr("d", d => line(d));
    }
}
