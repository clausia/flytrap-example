// by Piotr Migdał, https://p.migdal.pl/
// and Claudia Zendejas-Morales, https://claudiazm.xyz/
// inspiration from http://tensornetwork.org/diagrams/


function drawDiagram(tensors, contractions, lines, idContainer, widthContainer, heightContainer, startColorIndex = 0) {


    // **********************************************************
    //                      Validations
    // **********************************************************

    if(invalidVar(tensors)) {
        if(!invalidVar(contractions)) {
            throw ".:. Cannot specify contractions without nodes"; //cannot continue
        } else { //contractions is invalid
            tensors = [];
            contractions = [];
            if(invalidVar(lines)) {
                throw ".:. Cannot generate a diagram without any element specification"; //cannot continue
            }
        }
    } else {
        if(invalidVar(contractions)) contractions = [];
        if(invalidVar(lines)) lines = [];
    }

    if(invalidVar(idContainer)) {
        throw ".:. The id of the 'div' where the diagram will be drawn must be specified"; //cannot continue
    }

    if(invalidVar(widthContainer) || invalidVar(heightContainer)) {
        throw ".:. The size in pixels of the diagram must be specified"; //cannot continue
    }

    // **********************************************************
    //                      Definitions
    // **********************************************************


    // define distance and directions for index directions
    const shifts = {
        up:    [ 0.00, -0.75],
        down:  [ 0.00,  0.75],
        left:  [-0.75,  0.00],
        right: [ 0.75,  0.00]
    };

    // define a color scale to assign colors to nodes
    const colorScale = d3.scaleOrdinal()
        .range(["#763E9B", "#00882B", "#C82505", "#0165C0", "#EEEEEE"].slice(startColorIndex));

    const xScale = d3.scaleLinear()
        .domain([0, 8])
        .range([20, 500]);

    const yScale = d3.scaleLinear()
        .domain([0, 8])
        .range([60, 500]);

    const lineFunction = d3.line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

    const curveFunction = d3.line()
        .curve(d3.curveBundle);


    // **********************************************************
    //                      Rearrangements
    // **********************************************************


    // add source/target by id or name, also determine the shift according to the position specified
    contractions.forEach((d) => {
        if (typeof d.source !== "number" || typeof d.target !== "number") {
            throw ".:. Source and target in contractions must be numbers"; //cannot continue
        }
        if (typeof d.source === "number") {
            d.source = tensors[d.source]
        }
        if (typeof d.target === "number") {
            d.target = tensors[d.target]
        }
    });


    // **********************************************************
    //                    Elements in formula
    // **********************************************************


    // add same color to elements in formula as indicated w/idEqPart parameter
    tensors.forEach((d) => {
        d3.selectAll('#' + d.idEqPart).style("color", colorScale(d.name));
    });


    // **********************************************************
    //                   Container for diagram
    // **********************************************************


    // select the container in which the diagram will be drawn
    const svg = d3.select("#" + idContainer)
        .append("svg")
        .attr("width", widthContainer)
        .attr("height", heightContainer);


    // **********************************************************
    //                         Drawing
    // **********************************************************


    // draw contractions

    let already_drawn_contraction = []; // remember indexes (indicated as contractions) already drawn

    svg.selectAll(".contraction") // lines and 'loops'
        .data(contractions)
        .enter()
        .each(function(d, i) {

            already_drawn_contraction.push(d.name);

            let shift_y_per_contraction = 0;
            if(d.source.shape == "rectangle") {
                shift_y_per_contraction = contractions.slice(0, i)
                                              .filter((o) =>
                                                  o.source.name == d.source.name && o.target.name == d.target.name
                                              ).length;
            }

            let source = {
                x: d.source.x,
                y: d.source.y + shift_y_per_contraction
            };
            let target = {
                x: d.target.x,
                y: d.target.y + shift_y_per_contraction
            };

            d3.select(this)
                .append("path")
                .attr("class", "contraction")
                .attr("d", function(d) {

                    const source_pos = d.source.indices.filter((o) => o.name == d.name)[0].pos;
                    const target_pos = d.target.indices.filter((o) => o.name == d.name)[0].pos;

                    if((source_pos == "right" && target_pos == "left") ||
                       (source_pos == "down" && target_pos == "up")) {    // draw a straight line

                        return lineFunction([source, target]); //validate if there are nodes in between

                    } else {                                              // draw a curve line


                        let dir_x = 0;     // d.pos: "left", "right"
                        let dir_y = 0;     // d.pos: "up", "down"
                        let dir_x_out = 0; // source_pos = "right", "left"
                        let dir_x_in = 0;  // target_pos = "right", "left"
                        let dir_y_out = 0; // source_pos = "down", "up"
                        let dir_y_in = 0;  // target_pos = "down", "up

                        if(d.pos == "up") dir_y = 1;
                        else if(d.pos == "down") dir_y = -1;
                        else if(d.pos == "left") dir_x = 1;
                        else if(d.pos == "right") dir_x = -1;
                        else throw ".:. Position in loop contractions must be specified"; //cannot continue


                        if(source_pos == "right") dir_x_out = 1;
                        else if(source_pos == "left") dir_x_out = -1;
                        else if(source_pos == "down") dir_y_out = 1;
                        else if(source_pos == "up") dir_y_out = -1;
                        else throw ".:. Position in source index must be specified"; //cannot continue


                        if(target_pos == "right") dir_x_in = 1;
                        else if(target_pos == "left") dir_x_in = -1;
                        else if(target_pos == "down") dir_y_in = 1;
                        else if(target_pos == "up") dir_y_in = -1;
                        else throw ".:. Position in target index must be specified"; //cannot continue


                        return curveFunction([
                            [xScale(d.source.x),                                                  yScale(d.source.y)],
                            [xScale(d.source.x) + dir_x_out * 10,                                 yScale(d.source.y) + dir_y_out * 10],
                            [xScale(d.source.x - dir_x * 0.2 + dir_x_out * 0.5) + dir_x_out * 10, yScale(d.source.y - dir_y * 0.2 + dir_y_out * 0.5) + dir_y_out * 10],
                            [xScale(d.source.x - dir_x * 1.05 + dir_x_out * 0.7),                 yScale(d.source.y - dir_y * 1.05 + dir_y_out * 0.7)],
                            [xScale(d.target.x - dir_x * 1.05 + dir_x_in * 0.7),                  yScale(d.target.y - dir_y * 1.05 + dir_y_in * 0.7)],
                            [xScale(d.target.x - dir_x * 0.2 + dir_x_in * 0.5) + dir_x_in * 10,   yScale(d.target.y - dir_y * 0.2 + dir_y_in * 0.5) + dir_y_in * 10],
                            [xScale(d.target.x) + dir_x_in * 10,                                  yScale(d.target.y) + dir_y_in * 10],
                            [xScale(d.target.x),                                                  yScale(d.target.y)]
                        ]);

                    }

                });
        });


    // draw nodes w/indices (loose ends)

    svg.selectAll(".tensor")
        .data(tensors)
        .enter()
        .each(function(d, i) {

            if(d.shape == "rectangle") {
                // determine the height (in positions) of this rectangular node
                d.rectHeight = Math.max(d.indices.filter((o) => o.pos == "right").length,
                                        d.indices.filter((o) => o.pos == "left").length)
            }

            // first draw pending indices (the ones that are not drawn before, not in already_drawn_contraction)
            const indicesToDraw = []
            d.indices.forEach(function(index, j){
                if(!already_drawn_contraction.includes(index.name)) {

                    let shift_y_per_index = 0;
                    let shift_y_rect_down = 0;

                    if(d.shape == "rectangle") {

                        if(index.pos == "right" || index.pos == "left") {
                            // check if there is more than one index either left or right
                            shift_y_per_index = d.indices.slice(0, j).filter((o) => o.pos == index.pos).length;
                        }

                        if(index.pos == "down") { shift_y_rect_down = d.rectHeight - 1; }
                    }

                    // get how much an index should move to any cardinal point
                    const dv = shifts[index.pos];

                    index.source = {
                        x: d.x,
                        y: d.y + shift_y_per_index
                    };
                    index.target = {
                        x: d.x + dv[0],
                        y: d.y + dv[1] + shift_y_per_index + shift_y_rect_down
                    };
                    index.labelPosition = {
                        x: d.x + 1.4 * dv[0],
                        y: d.y + 1.4 * dv[1] + shift_y_per_index + shift_y_rect_down
                    };
                    indicesToDraw.push(index);
                }
            });
            svg.selectAll("#idx"+d.name) // identify in a particular way the indices of this node
                .data(indicesToDraw)
                .enter()
                .each(function(idx, i) {
                    //console.log(d);

                    // draw loose ends
                    d3.select(this)
                        .append("path")
                        .attr("class", "contraction")
                        //.style("stroke", "red")                                       //  <- quitar, solo es pa ver
                        .attr("d", (idx) => lineFunction([idx.source, idx.target]));

                    //draw indices names
                    d3.select(this)
                        .append("text")
                        .attr("class", "contraction-label")
                        .attr("x", (idx) => xScale(idx.labelPosition.x))
                        .attr("y", (idx) => yScale(idx.labelPosition.y))
                        .text((idx) => idx.name);
                });

            // second draw nodes
            let selected = d3.select(this);
            let shape = drawShape(selected, d, xScale, yScale);
            if(shape)
                shape.attr("class", "tensor")
                    .style("fill", (d) => d.shape === "dot" ? "black" : colorScale(d.name))
                    .on("mouseover", (event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', true))
                    .on("mouseout", (event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', false));

            // third draw tensor names
            selected.append("text")
                .attr("class", "tensor-label")
                .attr("x", (d) => d.labPos === "left" || d.labPos === "leftup" ? xScale(d.x - 0.5) : xScale(d.x))
                .attr("y", (d) => d.labPos === "left" ? yScale(d.y + 0.1) : yScale(d.y - 0.4))
                .text((d) => d.shape === "dot" || d.shape === "asterisk" ? "" : d.name);

        });

}

function drawShape(selected, d, xScale, yScale) {
    let shape;
    if( d.shape === undefined ) d.shape = "circle"; //default value
    if( d.shape === "circle" || d.shape === "dot" ) {
        shape = selected
            .append("circle")
            .attr("r", d.shape === "dot" ? 5 : 10)
            .attr("cx", (d) => xScale(d.x))
            .attr("cy", (d) => yScale(d.y));
    } else if( d.shape === "asterisk" ) {
        shape = selected
            .append("path")
            .attr("d", function(d) {
                const sx = xScale(d.x);
                const sy = yScale(d.y);
                return ' M ' + (sx-7) +' '+ (sy-7) +
                       ' L ' + (sx+7) + ' ' + (sy+7) + ' L ' + (sx) + ' ' + (sy) +
                       ' L ' + (sx+7) + ' ' + (sy-7) + ' L ' + (sx-7) + ' ' + (sy+7) + ' L ' + (sx) + ' ' + (sy) +
                       ' L ' + (sx) + ' ' + (sy-10) + ' L ' + (sx) + ' ' + (sy+10) + ' L ' + (sx) + ' ' + (sy) +
                       ' L ' + (sx+10) + ' ' + (sy) + ' L ' + (sx-10) + ' ' + (sy) + ' L ' + (sx) + ' ' + (sy) +
                       ' z';
            });
    } else if( d.shape === "square" ) {
        shape = selected
            .append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", (d) => xScale(d.x) - 10)
            .attr("y", (d) => yScale(d.y) - 10);
    } else if( d.shape === "triangleUp" ) {
        shape = selected
            .append("path")
            .attr("d", function(d) {
                const sx = xScale(d.x) - 10;
                const sy = yScale(d.y) + 10;
                return 'M ' + sx +' '+ sy + ' L ' + (sx+20) + ' ' + (sy) + 'L ' + (sx+10) + ' ' + (sy-20) + ' z';
            });
    } else if( d.shape === "triangleDown" ) {
        shape = selected
            .append("path")
            .attr("d", function(d) {
                const sx = xScale(d.x) - 10;
                const sy = yScale(d.y) - 10;
                return 'M ' + sx +' '+ sy + ' L ' + (sx+20) + ' ' + (sy) + 'L ' + (sx+10) + ' ' + (sy+20) + ' z';
            });
    } else if( d.shape === "triangleLeft" ) {
        shape = selected
            .append("path")
            .attr("d", function(d) {
                const sx = xScale(d.x) - 10;
                const sy = yScale(d.y);
                return 'M ' + sx +' '+ sy + ' L ' + (sx+20) + ' ' + (sy+10) + 'L ' + (sx+20) + ' ' + (sy-10) + ' z';
            });
    } else if( d.shape === "triangleRight" ) {
        shape = selected
            .append("path")
            .attr("d", function(d) {
                const sx = xScale(d.x) - 10;
                const sy = yScale(d.y) - 10;
                return 'M ' + sx +' '+ sy + ' L ' + (sx) + ' ' + (sy+20) + 'L ' + (sx+20) + ' ' + (sy+10) + ' z';
            });
    } else if( d.shape === "rectangle" ) {
        // the height of the rectangle will depend on the number of indices it has, either on the left or on the right
        shape = selected
            .append("rect")
            .attr("width", 20)
            .attr("height", (d) => yScale(d.rectHeight - 2) + 15)
            .attr("x", (d) => xScale(d.x) - 10)
            .attr("y", (d) => yScale(d.y) - 10)
            .attr("rx", 7)
            .attr("ry", 7);
    }
    return shape;
}

function invalidVar(variable){
    return typeof variable === 'undefined' || variable === null;
}