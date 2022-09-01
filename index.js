// ---- Global Variables ----
const NODE_RADIUS = 12;
const ARROW_SIZE = 4;
let Graph;
// keeps track of how many step 1 input boxes have been created
let inputCounter = 0;
let data = {
    "nodes": [],
    "links": [],
    "linkCounter": {},
}
let step = 1;


// On Load
window.onload = function() {
    createNewInput();

    const graphDiv = document.getElementById('graph')

    graphDiv.onmouseover = () => {
        document.body.style.cursor = "pointer";
        console.log(data);
    }

    graphDiv.onmouseleave = () => {
        document.body.style.cursor = "default";
    }

    // Graph Javascript
    Graph = ForceGraph()
        (graphDiv)

    Graph.graphData(data)
        .nodeId('id')
        .nodeVal(NODE_RADIUS)
        .nodeLabel('')
        .nodeAutoColorBy('group')
        .linkSource('source')
        .linkTarget('target')
        .width(window.innerWidth >= 768 ? window.innerWidth * .6 : window.innerWidth)
        .height(window.innerWidth >= 768 ? window.innerHeight : window.innerHeight * 0.6)
        .maxZoom(5)
        .minZoom(1)
        .nodeCanvasObject((node, ctx, globalScale) => {
            // draw label
            const label = node.name;
            const fontSize = 6;
            ctx.lineWidth = 1;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${fontSize}px Sans-Serif`
            ctx.fillText(label, node.x, node.y);
            // draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
            ctx.stroke();
        })
        .linkCanvasObject((link, ctx, globalScale) => {
            ctx.lineWidth = 1;
            const source = scaleTriangle(link);
            const dx = (source[2] - source[0]);
            const dy = (source[3] - source[1]);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const x99 = (source[2] - source[0]) * 0.99;
            const y99 = (source[3] - source[1]) * 0.99;
            const src = Math.min(link.source.id, link.target.id);
            const tgt = Math.max(link.source.id, link.target.id);
            const mx = (link.target.x + link.source.x) / 2
            const my = (link.target.y + link.source.y) / 2
            let fx = mx;
            let fy = my;
            if (data.linkCounter[src + "-" + tgt] === 1) {
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.moveTo(source[0], source[1]);
                ctx.lineTo(source[2], source[3]);
                ctx.stroke();
                drawArrow(ctx, source[0], source[1], source[0] + x99, source[1] + y99, .9);
            } else {
                const h = (Math.sqrt(dist) * 2 + (Math.floor((link.repeatCount + 1) / 2) - 1) * NODE_RADIUS * 1.5) * (link.source.id === src ? 1 : -1) * (dy < 0 ? 1 : -1) * (link.repeatCount % 2 === 0 ? 1 : -1);
                // perpendicular slope
                const ps = - x99 / y99
                const dfx = h / Math.sqrt(ps * ps + 1)
                const dfy = dfx * ps
                fx = dfx + mx;
                fy = dfy + my;
                const fitCircle = fitCircleToPoints(source[0], source[1], fx, fy, source[2], source[3]);
                const ang1 = Math.atan2(source[1] - fitCircle.y, source[0] - fitCircle.x);
                const ang2 = Math.atan2(source[3] - fitCircle.y, source[2] - fitCircle.x);
                ctx.beginPath();
                ctx.arc(fitCircle.x, fitCircle.y, fitCircle.radius, ang1, ang2, fitCircle.CCW);
                ctx.strokeStyle = "black";
                ctx.stroke();

                const rdx = source[2] - fitCircle.x
                const rdy = source[3] - fitCircle.y
                // slope
                const rm = rdy / rdx
                // perp of rm
                const prm = - rdx / rdy
                let flip = 1;
                if ((link.repeatCount % 2 === 0 && link.source.id === src) || (link.repeatCount % 2 === 1 && link.source.id === tgt)) {
                    flip = -1;
                }
                const arrdfx = - dist / Math.sqrt(prm * prm + 1) * (rdy > 0 ? -1 : 1) * flip;
                const arrdfy = arrdfx * prm
                const arrfx = arrdfx + source[2]
                const arrfy = arrdfy + source[3]
                drawArrow(ctx, arrfx, arrfy, source[2], source[3], .9);
            }


            // draw rate label circle
            ctx.beginPath();
            ctx.arc(fx, fy, NODE_RADIUS * 0.5, 0, 2 * Math.PI);
            ctx.strokeStyle = link.inducer === undefined ? "green" : "red";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.fill();
            // // TODO: make global variable
            // // TODO: font-sizing so that the text fits in the circle
            ctx.fillStyle = "black";
            ctx.font = "bold 4px sans-serif";
            ctx.fillText((link.rate === undefined ? "" : link.rate) + (link.inducer === undefined ? "" : (", " + data.nodes.find(node => node.id === link.inducer).name)), fx, fy);
        })
        .onNodeHover((node) => {
            if (node === null) {
                document.body.style.cursor = "pointer";
            } else {
                document.body.style.cursor = "grab";
            }
        })
        .d3Force('charge', null)
        .d3Force('center', null)
        .d3Force('collide', d3.forceCollide(NODE_RADIUS / 2))
        .d3Force('link', null)

    function fitCircleToPoints(x1, y1, x2, y2, x3, y3) {
        var x, y, u;
        const slopeA = (x2 - x1) / (y1 - y2); // slope of vector from point 1 to 2
        const slopeB = (x3 - x2) / (y2 - y3); // slope of vector from point 2 to 3
        if (slopeA === slopeB) { return } // Slopes are same thus 3 points form striaght line. No circle can fit.
        if (y1 === y2) {   // special case with points 1 and 2 have same y 
            x = ((x1 + x2) / 2);
            y = slopeB * x + (((y2 + y3) / 2) - slopeB * ((x2 + x3) / 2));
        } else
            if (y2 === y3) { // special case with points 2 and 3 have same y 
                x = ((x2 + x3) / 2);
                y = slopeA * x + (((y1 + y2) / 2) - slopeA * ((x1 + x2) / 2));
            } else {
                x = ((((y2 + y3) / 2) - slopeB * ((x2 + x3) / 2)) - (u = ((y1 + y2) / 2) - slopeA * ((x1 + x2) / 2))) / (slopeA - slopeB);
                y = slopeA * x + u;
            }

        return {
            x, y,
            radius: ((x1 - x) ** 2 + (y1 - y) ** 2) ** 0.5,
            CCW: ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) >= 0,
        };
    }

    function scaleTriangle(link) {
        const d = Math.sqrt((Math.pow(link.target.x - link.source.x, 2) + Math.pow(link.target.y - link.source.y, 2)))
        const d_y = link.target.y - link.source.y;
        const d_x = link.target.x - link.source.x;
        const y_i = ((NODE_RADIUS * d_y) / d);
        const x_i = ((NODE_RADIUS * d_x) / d);
        return [x_i + link.source.x, y_i + link.source.y, -x_i + link.target.x, -y_i + link.target.y];
    }

    function drawArrow(ctx, x1, y1, x2, y2, t = 0.9) {
        const adx = x2 - x1;           // arrow dx
        const ady = y2 - y1;           // arrow dy
        const dist = Math.sqrt(adx * adx + ady * ady);
        const middleX = x2 - ARROW_SIZE * adx / dist;  // shaft end x
        const middleY = y2 - ARROW_SIZE * ady / dist; // shaft end y
        const tdx = x2 - middleX;      // tip dx
        const tdy = y2 - middleY;      // tip dy
        ctx.beginPath();
        ctx.moveTo(middleX + 0.5 * tdy, middleY - 0.5 * tdx);
        ctx.lineTo(middleX - 0.5 * tdy, middleY + 0.5 * tdx);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.fill();
    };

    const step1 = document.getElementById("step1-container");
    step1.style.display = "flex";

}

function handleNext() {
    const formTitle = document.getElementById("formTitle");
    if (step === 1) {
        step1Next();
    } else if (step === 2) {
        data.links.sort((a, b) => {
            if (a.source.name !== b.source.name) {
                return a.source.name.localeCompare(b.source.name, undefined, { numeric: true })
            } else {
                return a.target.name.localeCompare(b.target.name, undefined, { numeric: true })
            }
        })
        Graph.graphData(data);
        step++;
        const step2 = document.getElementById("step2-container");
        const step3 = document.getElementById("step3-container");
        step2.style.display = "none";
        step3.style.display = "flex";
        formTitle.innerHTML = "Data Input (Step 3)"
        console.log(data.links.filter(link => link.inducer === undefined));
        if (data.links.filter(link => link.inducer === undefined).length === 0) {
            console.log("hit")
            handleNext();
        } else {
            renderStep3();
        }
    } else if (step === 3) {
        step3Next();
    } else if (step === 4) {
        //step3Next();
        step++;
        const step4 = document.getElementById("step4-container");
        const step5 = document.getElementById("step5-container");
        step4.style.display = "none";
        step5.style.display = "flex";
        formTitle.innerHTML = "Data (Step 5)";
        renderStep5();
    }
}

function handleBack() {
    if (step === 2) {
        step--;
        const step1 = document.getElementById("step1-container");
        const step2 = document.getElementById("step2-container");
        step1.style.display = "flex";
        step2.style.display = "none";
    } else if (step === 3) {
        step--;
        const step2 = document.getElementById("step2-container");
        const step3 = document.getElementById("step3-container");
        step2.style.display = "flex";
        step3.style.display = "none";
    } else if (step === 4) {
        step--;
        const step3 = document.getElementById("step3-container");
        const step4 = document.getElementById("step4-container");
        step3.style.display = "flex";
        step4.style.display = "none";
        if (data.links.filter(link => link.inducer === undefined).length === 0) {
            handleBack();
        }
    } else if (step === 5) {
        step--;
        const step4 = document.getElementById("step4-container");
        const step5 = document.getElementById("step5-container");
        step4.style.display = "flex";
        step5.style.display = "none";
    }

    const formTitle = document.getElementById("formTitle");
    formTitle.innerHTML = "Data Input (Step " + step + ")";
}



// -------- STEP 1 --------


// creates a new input box for a new node in step 1
function createNewInput() {
    // increment (by 1) the amount of inputs we created
    inputCounter++;

    // holds everything for this new input
    const inptGroup = document.createElement("div");
    // making the input group a bootstrap-styled input group
    inptGroup.className = "input-group mb-3 w-100";

    // the actual input
    const inpt = document.createElement("input");
    // sets the type of input to a text input
    inpt.type = 'text';
    // gives the input a unique id (so we can reference later to correspond to the correct node)
    inpt.id = 's-1-input-' + inputCounter;
    // making the input a bootstrap-styled input
    inpt.className = 'form-control';
    // setting placeholder
    inpt.placeholder = 'State Name';
    // for bootstrap / accessibility  
    inpt.ariaLabel = 'State Name';

    // create input button to delete an input / node
    const button = document.createElement("button");
    // bootstrap styling it
    button.className = "btn btn-danger";
    button.type = "button";
    // unique button id that corresponds to a node
    button.id = "button-addon-" + inputCounter;
    // unique button id, but just the number 
    button.count = inputCounter;
    // sets the button text
    button.innerHTML = "Delete";

    // listens to see if user presses delete button
    button.addEventListener('click', deleteInput);

    function deleteInput(e) {
        // make sure that we're not deleting the last input (which means we always have at least one input)
        if (button.count !== inputCounter) {
            // deletes the input group from the DOM
            inptGroup.remove();
            // keeps every node that has an id not equal to the button.count (corresponds to a specific node) 
            data.nodes = data.nodes.filter(node => node.id !== button.count);
            // keeps every link that doesn't have source node id equal to the button.count or a target node id equal to the button count 
            // deletes any links that go from or to the node
            data.links = data.links.filter(link => !(link.source.id === button.count || link.target.id === button.count))
            Graph.graphData(data);
        }
    }

    // get the step1-container
    const element = document.getElementById("step1-container");
    // put input group inside the step1-container
    element.appendChild(inptGroup);
    // put inpt into input group 
    inptGroup.appendChild(inpt);
    // put button into input group, after the input
    inptGroup.appendChild(button);

    // listens to see if the input text got changed
    inpt.addEventListener('input', updateValue);
    // keeps track of whether the input has already been created 
    let inputCreated = false;

    function updateValue(e) {
        // if the input has not been created
        if (!inputCreated) {
            // set the input to have been created
            inputCreated = true;
            // create a new node (and push it to the data.nodes) and give the new node's name a value of whatever was input
            data.nodes.push({
                id: button.count,
                name: e.target.value,
                x: 0,
                y: 0
            })
            // temporarily sets the collision force to the whole node radius so that nodes do not intersect on creation
            Graph.d3Force('collide', d3.forceCollide(NODE_RADIUS * 1.2))
            Graph.graphData(data);
            setTimeout(() => Graph.d3Force('collide', d3.forceCollide(NODE_RADIUS / 2)), 400)
            // set up a new blank input box 
            createNewInput();
        } else {
            // find the pre-existing node by id
            let node = data.nodes.find(x => x.id === button.count);
            // remove any red border
            inpt.classList.remove("border");
            inpt.classList.remove("border-danger");
            // updates the name to the new value in the input
            node.name = e.target.value;
            Graph.graphData(data);
        }
    }
}

// validating step 1 nodes and proceeding to step 2 if all is good
function step1Next() {
    // create empty set that will hold duplicate / empty nodes
    let badState = new Set();
    for (let i = 0; i < data.nodes.length; i++) {
        // check for duplicate state names
        for (let j = i + 1; j < data.nodes.length; j++) {
            // if two nodes have the same name, then both get added to the badState Set
            if (data.nodes[i].name === data.nodes[j].name) {
                badState.add(data.nodes[i].id);
                badState.add(data.nodes[j].id);
            }
        }
        // if the node name is an empty string, then add it to the badState Set 
        if (data.nodes[i].name.length === 0) {
            badState.add(data.nodes[i].id);
        }
    }

    // makes the badState Set into an array (which can be iterated over)
    const repeat = Array.from(badState);
    for (let i = 0; i < repeat.length; i++) {
        // finds the corresponding input and adds a red border
        const element = document.getElementById('s-1-input-' + repeat[i]);
        element.className += " border border-danger"
    }

    // if there's no bad nodes and we have at least one node, continue to step 2 
    if (repeat.length === 0 && data.nodes.length > 0) {
        // increment step (move to next step)
        step++;
        // get step 1 container and hide it
        const element = document.getElementById("step1-container");
        element.style.display = "none";
        // sorts the nodes alphabetically 
        data.nodes.sort((a, b) => a.name.localeCompare(b.name));
        document.getElementById("formTitle").innerHTML = "Data Input (Step 2)";
        renderStep2();
    }
}



// -------- STEP 2 --------



function renderStep2() {
    const show = document.getElementById("step2-container");
    show.style.display = "flex";

    const container = document.getElementById("step2-container");

    const oldAccordion = document.getElementById("accordionOpen");
    if (oldAccordion !== null) {
        container.removeChild(oldAccordion);
    }

    const accordion = document.createElement("div");
    accordion.className = "accordion";
    accordion.id = "accordionOpen";

    container.appendChild(accordion);

    for (let i = 0; i < data.nodes.length; i++) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const accordionHeader = document.createElement("h2");
        accordionHeader.className = "accordion-header";
        accordionHeader.id = "openAccordionHeading-" + data.nodes[i].id;

        const accordionButton = document.createElement("button");
        accordionButton.className = "accordion-button" + (i === 0 ? "" : " collapsed");
        accordionButton.type = "button";
        accordionButton.setAttribute("data-bs-toggle", "collapse");
        accordionButton.setAttribute("data-bs-target", "#panels-collapse-" + data.nodes[i].id);
        accordionButton.ariaExpanded = i === 0 ? "true" : "false";
        accordionButton.setAttribute("aria-controls", "panels-collapse-" + data.nodes[i].id);
        accordionButton.innerHTML = "Links from State " + data.nodes[i].name + ":"

        const accordionPanel = document.createElement("div");
        accordionPanel.id = "panels-collapse-" + data.nodes[i].id;
        accordionPanel.className = "accordion-collapse collapse" + (i === 0 ? " show" : "");
        accordionPanel.setAttribute("aria-labelledby", "openAccordionHeading-" + data.nodes[i].id);

        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";
        accordionBody.id = "accordion-body-" + data.nodes[i].id;

        accordion.appendChild(accordionItem);
        accordionItem.appendChild(accordionHeader);
        accordionHeader.appendChild(accordionButton);
        accordionItem.appendChild(accordionPanel);
        accordionPanel.appendChild(accordionBody);

        for (let j = 0; j < data.nodes.length; j++) {
            if (i !== j) {
                const formCheck = document.createElement("div");
                formCheck.className = "form-check";

                const link = data.links.find(obj => obj.source.id === data.nodes[i].id && obj.target.id === data.nodes[j].id)

                const input = document.createElement("input");
                input.className = "form-check-input";
                input.type = "checkbox";
                input.value = "";
                input.id = "flexCheck" + data.nodes[i].id + "-" + data.nodes[j].id;
                if (link !== undefined) {
                    input.checked = true;
                }
                let src = Math.min(data.nodes[i].id, data.nodes[j].id);
                let tgt = Math.max(data.nodes[i].id, data.nodes[j].id);
                input.onclick = function() {
                    if (input.checked) {
                        if (data.linkCounter[src + "-" + tgt] === undefined) {
                            data.linkCounter[src + "-" + tgt] = 1;
                        } else {
                            data.linkCounter[src + "-" + tgt]++;
                        }
                        data.links.push({
                            id: data.nodes[i].id + "-" + data.nodes[j].id,
                            source: data.nodes[i].id,
                            target: data.nodes[j].id,
                            repeatCount: data.linkCounter[src + "-" + tgt]
                        })
                    } else {
                        data.links = data.links.filter(link => !(link.source.id === data.nodes[i].id && link.target.id === data.nodes[j].id));
                        data.linkCounter[src + "-" + tgt]--;
                    }
                    Graph.graphData(data);
                }

                const label = document.createElement("label");
                label.className = "form-check-label";
                label.for = "flexCheck" + data.nodes[i].id + "-" + data.nodes[j].id;
                label.innerHTML = data.nodes[j].name;

                const accordionBody = document.getElementById("accordion-body-" + data.nodes[i].id);
                accordionBody.appendChild(formCheck);
                formCheck.appendChild(input);
                formCheck.appendChild(label);
            }
        }
    }
}



// -------- STEP 3 --------



function renderStep3() {
    // delete anything that existed in step3-container
    const step3 = document.getElementById("step3-container");
    const stepTitle = document.createElement("h3");
    stepTitle.className = "title";
    stepTitle.innerHTML = "Node-Based Transition Rates"
    step3.replaceChildren(stepTitle);

    // loop through all data.links and create input fields for transition rates
    for (let i = 0; i < data.links.length; i++) {
        // create the link item element
        const linkItem = document.createElement("div");
        linkItem.id = "link-item-" + data.links[i].source.id + "-" + data.links[i].target.id;

        // create the link paragraph (label) element
        const linkPar = document.createElement("p");
        linkPar.innerHTML = "Link from " + data.links[i].source.name + " to " + data.links[i].target.name + ":";

        // create the div to put the input element
        const linkInputGroup = document.createElement("div");
        linkInputGroup.className = "input-group mb-3";
        linkInputGroup.id = "link-input-group-" + data.links[i].source.id + "-" + data.links[i].target.id;

        // create the actual input element
        const linkInput = document.createElement("input");
        linkInput.type = "number";
        linkInput.className = "form-control";
        linkInput.placeholder = "Transition Rate";
        linkInput.ariaLabel = "Transition Rate";
        linkInput.id = "link-input-" + data.links[i].source.id + "-" + data.links[i].target.id;
        linkInput.value = data.links[i].rate ?? '';

        // add an event listener to detect when the user types something in the input
        linkInput.addEventListener('input', updateValue);

        function updateValue(e) {
            // Find and update the corresponding link
            data.links[i].rate = e.target.value;
            linkInput.classList.remove("border");
            linkInput.classList.remove("border-danger");
            // Updating the graph
            Graph.graphData(data);
        }

        // actually add everything to the DOM and update the graph
        step3.appendChild(linkItem);
        linkItem.appendChild(linkPar);
        linkItem.appendChild(linkInputGroup);
        linkInputGroup.appendChild(linkInput);
        Graph.graphData(data);
    }
}

function step3Next() {
    // check inputs
    let valid = true;
    for (let i = 0; i < data.links.length; i++) {
        if (data.links[i].inducer === undefined) {
            const input = document.getElementById("link-input-" + data.links[i].source.id + "-" + data.links[i].target.id);
            if (data.links[i].rate === undefined || input.value.length === 0) {
                data.links[i].rate = undefined;
                valid = false;
                input.className += " border border-danger"
            }
        }
    }

    if (valid) {
        step++;
        const step3 = document.getElementById("step3-container");
        const step4 = document.getElementById("step4-container");
        step3.style.display = "none";
        step4.style.display = "flex";
        formTitle.innerHTML = "Data Input (Step 4)";
        renderStep4();
    }
}


// -------- STEP 4 --------

function renderStep4() {
    const step4 = document.getElementById("step4-container");
    const stepTitle = document.createElement("h3");
    stepTitle.className = "title";
    stepTitle.innerHTML = "Inducer-Based Transition Rates"
    step4.replaceChildren(stepTitle);

    const sourceLabel = document.createElement("p");
    sourceLabel.innerHTML = "Select Source Node:";

    const targetLabel = document.createElement("p");
    targetLabel.innerHTML = "Select Target Node:";

    const inducerLabel = document.createElement("p");
    inducerLabel.innerHTML = "Select Inducer Node:";

    const selectSource = document.createElement("select");
    selectSource.className = "form-select";
    selectSource.ariaLabel = "Select Source Node";
    selectSource.id = "selectSource";

    for (let i = 0; i < data.nodes.length; i++) {
        const option = document.createElement("option");
        option.value = data.nodes[i].id;
        option.innerHTML = data.nodes[i].name;
        option.id = "select-source-" + data.nodes[i].id;
        selectSource.appendChild(option);
    }

    const selectTarget = document.createElement("select");
    selectTarget.className = "form-select";
    selectTarget.ariaLabel = "Select Target Node";
    selectTarget.id = "selectTarget";

    for (let i = 0; i < data.nodes.length; i++) {
        const option = document.createElement("option");
        option.value = data.nodes[i].id;
        option.innerHTML = data.nodes[i].name;
        option.id = "select-target-" + data.nodes[i].id;
        selectTarget.appendChild(option);
    }

    const selectInducer = document.createElement("select");
    selectInducer.className = "form-select";
    selectInducer.ariaLabel = "Select Inducer Node";
    selectInducer.id = "selectInducer";

    for (let i = 0; i < data.nodes.length; i++) {
        const option = document.createElement("option");
        option.value = data.nodes[i].id;
        option.innerHTML = data.nodes[i].name;
        option.id = "select-inducer-" + data.nodes[i].id;
        selectInducer.appendChild(option);
    }

    const rateAndAddContainer = document.createElement("div");
    rateAndAddContainer.style.display = "flex";
    rateAndAddContainer.style.justifyContent = "space-between";
    rateAndAddContainer.className = "mb-3";

    const rateInputGroup = document.createElement("div");
    rateInputGroup.className = "input-group";
    rateInputGroup.style.width = "60%";

    const rateInput = document.createElement("input");
    rateInput.type = "number";
    rateInput.className = "form-control";
    rateInput.placeholder = "Enter Trans. Rate";
    rateInput.ariaLabel = "Enter Trans. Rate";

    rateInputGroup.appendChild(rateInput);

    let addButtonCounter = 0;
    const addButton = document.createElement("button");
    addButton.className = "btn btn-success";
    addButton.innerHTML = "Add";
    addButton.style.width = "30%";
    addButton.onclick = () => {
        let valid = true
        if (selectSource.value === selectTarget.value) {
            valid = false
            selectSource.className += " border border-danger";
            selectTarget.className += " border border-danger";
        } else {
            addButtonCounter++;
            selectSource.classList.remove("border");
            selectSource.classList.remove("border-danger");
            selectTarget.classList.remove("border");
            selectTarget.classList.remove("border-danger");
        }

        if (rateInput.value.length === 0) {
            valid = false
            rateInput.className += " border border-danger";
        } else {
            rateInput.classList.remove("border");
            rateInput.classList.remove("border-danger");
        }


        if (valid && data.links.find(link => link.source.id === parseInt(selectSource.value) && link.target.id === parseInt(selectTarget.value) && link.inducer === parseInt(selectInducer.value)) === undefined) {
            // TODO: show alert when tries to add an existing link
            const src = Math.min(selectSource.value, selectTarget.value);
            const tgt = Math.max(selectSource.value, selectTarget.value);
            if (data.linkCounter[src + "-" + tgt] === undefined) {
                data.linkCounter[src + "-" + tgt] = 1;
            } else {
                data.linkCounter[src + "-" + tgt]++;
            }
            data.links.push({
                id: selectSource.value + "-" + selectTarget.value + "-" + selectInducer.value,
                shortName: selectSource.options[selectSource.selectedIndex].text[0] + "-" + selectTarget.options[selectTarget.selectedIndex].text[0] + ", " + selectInducer.options[selectInducer.selectedIndex].text[0],
                source: parseInt(selectSource.value),
                target: parseInt(selectTarget.value),
                inducer: parseInt(selectInducer.value),
                rate: rateInput.value,
                repeatCount: data.linkCounter[src + "-" + tgt]
            })

            createEdgeEntry(data.links[data.links.length - 1])
        }


    }

    rateAndAddContainer.appendChild(rateInputGroup);
    rateAndAddContainer.appendChild(addButton);

    step4.appendChild(sourceLabel);
    step4.appendChild(selectSource);
    step4.appendChild(targetLabel);
    step4.appendChild(selectTarget);
    step4.appendChild(inducerLabel);
    step4.appendChild(selectInducer);
    step4.appendChild(rateAndAddContainer);

    for (let i = 0; i < data.links.length; i++) {
        if (data.links[i].inducer !== undefined) {
            createEdgeEntry(data.links[i]);
        }
    }
    
    Graph.graphData(data);
}

function createEdgeEntry(link) {
    const edgeGroup = document.createElement("div");
    edgeGroup.style.display = "flex";
    edgeGroup.style.flexWrap = "wrap";
    edgeGroup.style.justifyContent = "space-between";
    edgeGroup.className = "mt-3 mb-3 w-100";

    const collapseBttnDiv = document.createElement("div");
    collapseBttnDiv.style.width = "60%";
    const collapseBttn = document.createElement("button");
    collapseBttn.className = "btn btn-primary mb-3 w-100";
    collapseBttn.type = "button"
    collapseBttn.setAttribute("data-bs-toggle", "collapse");
    collapseBttn.setAttribute("data-bs-target", "#collapseWidthExample");
    collapseBttn.setAttribute("aria-controls", "collapseWidthExample");
    collapseBttn.ariaExpanded = "false";
    collapseBttn.innerHTML = "State Transition Edge " + link.shortName;
    const collapseStyle = document.createElement("div");
    collapseStyle.style.minHeight = "120px;"
    const collapse = document.createElement("div");
    collapse.className = "collapse";
    collapse.id = "collapseWidthExample";
    const collapseBody = document.createElement("div");
    collapseBody.className = "card card-body w-100";
    collapseBody.style;

    const displaySource = document.createElement("input");
    displaySource.className = "form-control mb-3";
    displaySource.type = "text";
    displaySource.value = link.source.name;
    displaySource.ariaLabel = "Disabled input example";
    displaySource.disabled = true;
    displaySource.readOnly = true;
    displaySource.style.width = "30%";

    const displayTarget = document.createElement("input");
    displayTarget.className = "form-control mb-3";
    displayTarget.type = "text";
    displayTarget.value = link.target.name;
    displayTarget.ariaLabel = "Disabled input example";
    displayTarget.disabled = true;
    displayTarget.readOnly = true;
    displayTarget.style.width = "30%";

    const displayInducer = document.createElement("input");
    displayInducer.className = "form-control mb-3";
    displayInducer.type = "text";
    displayInducer.value = data.links.find(l => l.id === link.inducer);
    displayInducer.ariaLabel = "Disabled input example";
    displayInducer.disabled = true;
    displayInducer.readOnly = true;
    displayInducer.style.width = "25%";

    const displayRate = document.createElement("input");
    displayRate.className = "form-control";
    displayRate.type = "text";
    displayRate.value = link.rate;
    displayRate.ariaLabel = "Disabled input example";
    displayRate.innerHTML = link.rate;
    displayRate.disabled = true;
    displayRate.readOnly = true;
    displayRate.style.width = "20%";

    //Icons
    const trash = document.createElement("i");
    trash.className = "bi bi-trash";
    const pen = document.createElement("i");
    pen.className = "bi bi-pen";
    const arrow = document.createElement("i");
    arrow.className = "bi bi-arrow-right";
    const checkmark = document.createElement("i");
    checkmark.className = "bi bi-check-lg";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger p-0 mb-3";
    deleteButton.appendChild(trash);
    deleteButton.style.width = "10%";
    deleteButton.onclick = () => {
        edgeGroup.remove();
    }

    const preSource = document.createElement("p");
    preSource.innerHTML = "Source: ";
    const sourceDivider = document.createElement("p");
    sourceDivider.innerHTML = "Target: ";
    const targetDivider = document.createElement("p");
    targetDivider.innerHTML = "Inducer: ";
    const inducerDivider = document.createElement("p");
    inducerDivider.innerHTML = "Rate: ";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-secondary p-0 mb-3";
    editButton.appendChild(pen);
    editButton.style.width = "10%";
    let editing = false;
    editButton.onclick = () => {
        if (!editing) {
            editing = true;
            //TODO: make tab collapse when edit button is clicked
            displaySource.disabled = false;
            displaySource.readOnly = false;
            displayTarget.disabled = false;
            displayTarget.readOnly = false;
            displayInducer.disabled = false;
            displayInducer.readOnly = false;
            displayRate.disabled = false;
            displayRate.readOnly = false;
            // add save changes or green check box and cancel button?
            const saveButton = document.createElement("button");
            saveButton.className = "btn btn-success";
            saveButton.appendChild(checkmark);
            saveButton.style.width = "15%";
            collapseBody.appendChild(saveButton);
            saveButton.onclick = () => {
                displaySource.disabled = true;
                displaySource.readOnly = true;
                displayTarget.disabled = true;
                displayTarget.readOnly = true;
                displayInducer.disabled = true;
                displayInducer.readOnly = true;
                displayRate.disabled = true;
                displayRate.readOnly = true;
                editing = false;
                collapseBody.removeChild(saveButton);
            }
        }
    }

    const step4 = document.getElementById("step4-container");

    step4.appendChild(edgeGroup);
    edgeGroup.appendChild(collapseBttnDiv);
    collapseBttnDiv.appendChild(collapseBttn);
    collapseStyle.appendChild(collapse);
    collapse.appendChild(collapseBody);
    collapseBody.appendChild(preSource);
    collapseBody.appendChild(displaySource);
    collapseBody.appendChild(sourceDivider);
    collapseBody.appendChild(displayTarget);
    collapseBody.appendChild(targetDivider);
    collapseBody.appendChild(displayInducer);
    collapseBody.appendChild(inducerDivider);
    collapseBody.appendChild(displayRate);
    // edgeGroup.appendChild(editButton);
    edgeGroup.appendChild(deleteButton);
    step4.appendChild(collapseStyle);
    Graph.graphData(data);
}

function renderStep5() {
    const step5 = document.getElementById("step5-container");
    const stepTitle = document.createElement("h3");
    stepTitle.className = "title";
    stepTitle.innerHTML = "Finished State Transition Rates";
    step5.replaceChildren(stepTitle);


    const fileText = document.createElement("textarea");
    fileText.id = "text";

    for (let i = 0; i < data.links.length; i++) {
        const fromState = data.links[i].source.name;
        const toState = data.links[i].target.name;
        let inducerState = "None";
        if (data.links[i].inducer !== undefined) {
            inducerState = data.nodes.find(node => node.id === data.links[i].inducer).name;
        }
        const rate = data.links[i].rate;
        const text = document.createElement("p");
        text.innerHTML = fromState + "&emsp;" + toState + "&emsp;" + inducerState + "&emsp;" + rate;

        fileText.innerHTML += fromState + "&#09;" + toState + "&#09;" + inducerState + "&#09;" + rate + "&#10";
        step5.appendChild(text);
        step5.appendChild(fileText);
        fileText.style.display = "none";
    }

    const downloadButton = document.createElement("button");
    downloadButton.className = "btn btn-primary";
    downloadButton.id = "btn"
    downloadButton.innerHTML = "Download";
    downloadButton.onclick = () => {
        const text = document.getElementById("text").value;
        download("str.tsv", text);
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }


    step5.appendChild(downloadButton);

    Graph.graphData(data);
}