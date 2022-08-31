// ---- Global Variables ----
const NODE_RADIUS = 12;
const ARROW_SIZE = 4;
let Graph;
// keeps track of how many step 1 input boxes have been created
let inputCounter = 0;
let data = {
    "nodes": [],
    "links": []
}
let step = 1;


// On Load
window.onload = function() {
    createNewInput();

    const graphDiv = document.getElementById('graph')

    graphDiv.onmouseover = () => {
        document.body.style.cursor = "pointer";
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
        .width(window.innerWidth >= 768 ? window.innerWidth * .7 : window.innerWidth)
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
            const curveRadius = 2 * NODE_RADIUS;
            const curveX = link.target.x + NODE_RADIUS / 2 / Math.sin(Math.PI / 4);
            const curveY = link.target.y - NODE_RADIUS / 2 / Math.sin(Math.PI / 4);
            const drawArrow = (ctx, x1, y1, x2, y2, t = 0.9) => {
                const adx = x2 - x1;           // arrow dx
                const ady = y2 - y1;           // arrow dy
                const dist = Math.sqrt(adx * adx + ady * ady);
                const middleX = x2 - ARROW_SIZE * adx / dist;  // shaft end x
                const middleY = y2 - ARROW_SIZE * ady / dist; // shaft end y
                const tdx = x2 - middleX;      // tip dx
                const tdy = y2 - middleY;      // tip dy
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(middleX, middleY);
                ctx.moveTo(middleX + 0.5 * tdy, middleY - 0.5 * tdx);
                ctx.lineTo(middleX - 0.5 * tdy, middleY + 0.5 * tdx);
                ctx.lineTo(x2, y2);
                ctx.closePath();
                ctx.stroke();
            };
            const source = scaleTriangle(link);
            ctx.beginPath();
            ctx.strokeStyle = "black";
            // ctx.moveTo(source[0], source[1]);
            // ctx.lineTo(source[2], source[3]);
            const dx = (source[2] - source[0]) * 0.99;
            const dy = (source[3] - source[1]) * 0.99;
            drawArrow(ctx, source[0], source[1], source[0] + dx, source[1] + dy, .9);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            if (link.repeated) {
                // TODO: Make curved verison
            } else {
                ctx.arc((link.target.x + link.source.x) / 2, (link.target.y + link.source.y) / 2, NODE_RADIUS * 0.5, 0, 2 * Math.PI);
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.strokeStyle = "green";
                ctx.stroke();
                // TODO: make global variable
                // TODO: font-sizing so that the text fits in the circle
                ctx.fillStyle = "black";
                ctx.font = "bold 4px sans-serif";
                ctx.fillText(link.rate ?? "", (link.target.x + link.source.x) / 2, (link.target.y + link.source.y) / 2);
            }
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


    function scaleTriangle(link) {
        const d = Math.sqrt((Math.pow(link.target.x - link.source.x, 2) + Math.pow(link.target.y - link.source.y, 2)))
        const d_y = link.target.y - link.source.y;
        const d_x = link.target.x - link.source.x;
        const y_i = ((NODE_RADIUS * d_y) / d);
        const x_i = ((NODE_RADIUS * d_x) / d);
        return [x_i + link.source.x, y_i + link.source.y, -x_i + link.target.x, -y_i + link.target.y];
    }

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
        if (data.links.filter(link => link.inducer === undefined).length === 0) {
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
        handleBack();
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
                let repeatedLink = data.links.find(obj => obj.source.id === data.nodes[j].id && obj.target.id === data.nodes[i].id)
                console.log(repeatedLink);

                const input = document.createElement("input");
                input.className = "form-check-input";
                input.type = "checkbox";
                input.value = "";
                input.id = "flexCheck" + data.nodes[i].id + "-" + data.nodes[j].id;
                if (link !== undefined) {
                    input.checked = true;
                }
                input.onclick = function() {
                    repeatedLink = data.links.find(obj => obj.source.id === data.nodes[j].id && obj.target.id === data.nodes[i].id)

                    if (input.checked) {
                        data.links.push({
                            source: data.nodes[i].id,
                            target: data.nodes[j].id,
                            repeated: repeatedLink !== undefined
                        })
                        if (repeatedLink !== undefined) {
                            repeatedLink.repeated = true;
                        }
                    } else {
                        data.links = data.links.filter(link => !(link.source.id === data.nodes[i].id && link.target.id === data.nodes[j].id));
                        if (repeatedLink !== undefined) {
                            repeatedLink.repeated = false;
                        }
                    }
                    console.log(data.links);
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
        const input = document.getElementById("link-input-" + data.links[i].source.id + "-" + data.links[i].target.id);
        if (data.links[i].rate === undefined || input.value.length === 0) {
            data.links[i].rate = undefined;
            valid = false;
            input.className += " border border-danger"
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

    const rateInputGroup = document.createElement("div");
    rateInputGroup.className = "input-group";
    rateInputGroup.style.width = "60%";

    const rateInput = document.createElement("input");
    rateInput.type = "number";
    rateInput.className = "form-control";
    rateInput.placeholder = "Enter Trans. Rate";
    rateInput.ariaLabel = "Enter Trans. Rate";

    rateInputGroup.appendChild(rateInput);

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
            console.log(data.links);
            // TODO: show alert when tries to add an existing link
            data.links.push({
                source: parseInt(selectSource.value),
                target: parseInt(selectTarget.value),
                inducer: parseInt(selectInducer.value),
                rate: rateInput.value
            })
            const edge = document.createElement("div");
            edge.innerHTML = selectSource.value + selectTarget.value + selectInducer.value + rateInput.value;
            const deleteButton = document.createElement("button");
            deleteButton.className = "btn btn-danger";
            deleteButton.innerHTML = "X";
            deleteButton.style.width = "25%";
            deleteButton.onclick = () => {
            }
            Graph.graphData(data);
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
    step4.appendChild(edge);

    Graph.graphData(data);
}

function renderStep5() {
    const step5 = document.getElementById("step5-container");
    const stepTitle = document.createElement("h3");
    stepTitle.className = "title";
    stepTitle.innerHTML = "State Transition Rates";
    step5.replaceChildren(stepTitle);

    for (let i = 0; i < data.links.length; i++) {
        const fromState = data.links[i].source.name;
        const toState = data.links[i].target.name;
        let inducerState = "None";
        if (data.links[i].inducer !== undefined) {
            inducerState = data.links[i].inducer.name;
        }
        const rate = data.links[i].rate;

        const text = document.createElement("p");
        text.innerHTML = fromState + "&#09;" + toState + "&#09;" + inducerState + "&#09;" + rate;
        step5.appendChild(text);
    }
}