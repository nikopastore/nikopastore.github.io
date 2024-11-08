d3.csv("data/GDP_annual_growth_NEW.csv").then(function(data) {
    let top10Countries = [
        "United States", "China", "Japan", "Germany", 
        "India", "United Kingdom", "France", "Italy", 
        "Canada", "South Korea"
    ];

    let filteredData = data.filter(d => 
        top10Countries.includes(d.country) &&
        +d.year >= 2000 && +d.year <= 2020
    );

    filteredData.forEach(d => {
        d.year = +d.year;
        d.gdp_growth = +d.gdp_growth;
    });

    console.log(filteredData);

    createVisualization(filteredData);
}).catch(function(error){
    console.error("Error loading the CSV file: ", error);
});

function createVisualization(data) {
    console.log("Ready to create visualization with the data:", data);
}
