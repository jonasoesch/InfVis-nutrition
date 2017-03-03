d3.tsv('food-data.txt', function(err, tsv) {


    bla = tsv;

    data = tsv.map( function(entry) { return {
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

    let scale = {
        y: 0.2,
        x: 6,
        auto: function(data, dimension) {
            let size = 0;
            if (dimension === "x") { size = dimensions.innerWidth() }
            else if (dimension === "y") { size = dimensions.innerHeight() };

            if (this.cachedScales[dimension] === undefined) {
                this.cachedScales[dimension] = size / Math.max.apply(null, data.map(num => num[dimension]));
            } 
            return this.cachedScales[dimension];
        },
        cachedScales: {}
    }


    /**
     * Setting up the canvas
     */
    svg = d3.select("body").append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("transform", `translate(${dimensions.margin.top}, ${dimensions.margin.left})`);   
    // String interpolation with `${}`: http://es6-features.org/#StringInterpolation
    

     scaleX = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.x))])
        .range([0, dimensions.margin.left+dimensions.innerWidth()]);

      scaleY = d3.scaleLinear()
        .domain([0, d3.max(data, d => Number(d.y))])
        .range([0, dimensions.margin.top+dimensions.innerHeight()]);


    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", dimensions.dot)
        .attr("cx", d => scaleX(d.x) + dimensions.margin.left) 
    // Arrow function: http://es6-features.org/#ExpressionBodies
        .attr("cy", d => scaleY(d.y) + dimensions.margin.top);



    /*
     * Setting the axis
     */

    d3.select("svg")
        .append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .call(d3.axisLeft(scaleY));

    d3.select("svg")
        .append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .call(d3.axisBottom(scaleX));
})
