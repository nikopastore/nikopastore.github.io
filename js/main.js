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
    console.log("Ready to create visualization with the data:", data);

    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);

    svg.append("circle")
        .attr("cx", 400)
        .attr("cy", 200)
        .attr("r", 50)
        .attr("fill", "steelblue");
}
