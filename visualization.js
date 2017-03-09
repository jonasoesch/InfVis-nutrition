d3.tsv('food-data.txt', function(err, tsv) {


    let data = tsv.map( function(entry) { return {
        x: entry["carbohydrates, available"],
        y: entry["energy kJ"],
        label: entry["category D"].split("/")[0]
    }});

    /**
     * Configuring the canvas
     */
    let dimensions = { // `let`: http://es6-features.org/#BlockScopedVariables
        margin : {top: 10, right: 10, bottom: 10, left: 40},
        width: 720,
        innerWidth : function() { return this.width - this.margin.left - this.margin.right },
        height : 600, 
        innerHeight : function() {return this.height - this.margin.top - this.margin.bottom },
        dot: 2,
    }


    /**
     * Setting up the canvas
     */
    let canvas = d3.select("body").append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("class", "canvas")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`); // moves the canvas to the inside

    // String interpolation with `${}`: http://es6-features.org/#StringInterpolation
    

     let scaleX = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.x))])
        .range([0, dimensions.margin.left+dimensions.innerWidth()]);

      let scaleY = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.y))])
        .range([0, dimensions.margin.top+dimensions.innerHeight()]);


    canvas.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", dimensions.dot)
        .attr("cx", d => scaleX(d.x)) 
    // Arrow function: http://es6-features.org/#ExpressionBodies
        .attr("cy", d => scaleY(d.y));



    /*
     * Setting the axis
     */

    canvas
        .append("g")
        .attr("class", "margin-left")
        .call(d3.axisLeft(scaleY));

    canvas
        .append("g")
        .attr("class", "margin-top")
        .call(d3.axisBottom(scaleX));
})
