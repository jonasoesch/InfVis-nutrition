import * as d3 from 'd3';
import * as Canvas from './canvas.js';


d3.tsv('food-data.txt', function(err, tsv) {


    let data = tsv.map( function(entry) { return {
        x: entry["carbohydrates, available"],
        y: entry["energy kJ"],
        size: entry["fat, total"],
        label: entry["category D"].split("/")[0]
    }});



    let unique = function(value, index, self) {
        return self.indexOf(value) === index;
    };


   let colorscale = (function() {
        let keys = data.map(e => e.label).filter(unique);
        let palette = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928', '#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'];

       let colorscale = {};
       keys.forEach( (key, i) => colorscale[key] = palette[i]);

       return colorscale;
    })();

    Canvas.setup();
    let dimensions = Canvas.dimensions;
    let canvas = Canvas.canvas;


    /**
     * Scales
     */
     let scaleX = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.x))])
        .range([0, dimensions.margin.left+dimensions.innerWidth()]);

      let scaleY = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.y))])
        .range([dimensions.margin.top+dimensions.innerHeight(),0]);

     let scaleSize = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.size))])
        .range([0, 50]);



    /*
     * Axes
    */
    canvas
        .append("g")
        .attr("class", "margin-left")
        .call(d3.axisLeft(scaleY));

    canvas
        .append("g")
        .attr("class", "margin-bottom")
        .attr("transform", `translate(0, ${dimensions.innerHeight()+dimensions.margin.top})`)
        .call(d3.axisBottom(scaleX));


    /*
     * Axes labels
    */
    canvas
        .append("text")
        .attr('transform', "rotate(270,0,0)")
        .attr('x', dimensions.height/-2)
        .attr('y', -40)
        .text("energy kJ");

    canvas
        .append("text")
        .attr("x", dimensions.innerWidth()/2)
        .attr("y", dimensions.innerHeight() + dimensions.margin.top + dimensions.margin.bottom-15)
        .text("carbohydrates (g/100g)");

    let legend = canvas
        .append("g")
        .attr("transform", `translate(${dimensions.innerWidth() - 200}, 50)`);

    for (let i of [10, 25, 50, 100]) {
        legend
            .append("circle")
            .attr("r", scaleSize(i))
    }



    legend
        .append("text")
        .attr("x", 16)
        .attr("y", 4)
        .text("Total amount of fat");


    /*
     * Data
     */
    canvas.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("fill", d => colorscale[d.label])
        .attr("r", d => scaleSize(d.size))
        .attr("cx", d => scaleX(d.x))
    // Arrow function: http://es6-features.org/#ExpressionBodies
        .attr("cy", d => scaleY(d.y));
});
