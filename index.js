// Global Variables
const nodeRadius = 12;
let Graph;
let inputCounter = 0;
let data = {
    "nodes": [],
    "links": []
}
let step = 1;

// On Load
window.onload = function() {
    createNewInput();

    // Graph Javascript
    Graph = ForceGraph()
        (document.getElementById('graph'))

    Graph.graphData(data)
        .nodeId('id')
        .nodeVal(nodeRadius)
        .nodeLabel('')
        .nodeAutoColorBy('group')
        .linkSource('source')
        .linkTarget('target')
        .width(window.innerWidth * .7)
        .height(window.innerHeight)
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
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
            ctx.stroke();
        })
        .linkCanvasObject((link, ctx, globalScale) => {
            ctx.lineWidth = 1;
            const curveRadius = nodeRadius * 4;
            const curveX = link.target.x + nodeRadius / 2 / Math.sin(Math.PI / 4);
            const curveY = link.target.y - nodeRadius / 2 / Math.sin(Math.PI / 4);
            if (link.source.id === link.target.id) {
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.moveTo(curveX, curveY);
                ctx.bezierCurveTo(curveX, curveY - curveRadius, curveX + curveRadius, curveY, curveX, curveY);
                ctx.stroke();
            } else {
                const source = scaleTriangle(link);
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.moveTo(source[0], source[1]);
                ctx.lineTo(source[2], source[3]);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc((link.target.x + link.source.x) / 2, (link.target.y + link.source.y) / 2, nodeRadius / 1.5, 0, 2 * Math.PI);
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.strokeStyle = "green";
                ctx.stroke();
            }
        })
        .d3Force('charge', null)
        .d3Force('center', null)
        .d3Force('collide', d3.forceCollide(nodeRadius / 2))
        .d3Force('link', null)

    function scaleTriangle(link) {
        const d = Math.sqrt((Math.pow(link.target.x - link.source.x, 2) + Math.pow(link.target.y - link.source.y, 2)))
        const d_y = link.target.y - link.source.y;
        const d_x = link.target.x - link.source.x;
        const y_i = ((nodeRadius * d_y) / d);
        const x_i = ((nodeRadius * d_x) / d);
        return [x_i + link.source.x, y_i + link.source.y, -x_i + link.target.x, -y_i + link.target.y];
    }

    const step1 = document.getElementById("step1-container");
    step1.style.display = "flex";

}

function handleNext() {
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
        renderStep3();
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
    }
}



// -------- STEP 1 --------



function createNewInput() {
    inputCounter++;

    const inptGroup = document.createElement("div");
    inptGroup.id = "input-group";
    inptGroup.className = "input-group mb-3 w-100";

    const inpt = document.createElement("input");
    inpt.type = 'text';
    inpt.id = 's-1-input-' + inputCounter;
    inpt.className = 'form-control';
    inpt.placeholder = 'State Name';
    inpt.ariaLabel = 'State Name';

    const button = document.createElement("button");
    button.className = "btn btn-danger";
    button.type = "button";
    button.id = "button-addon-" + inputCounter;
    button.count = inputCounter;
    const node = document.createTextNode("Delete");
    button.appendChild(node);

    button.addEventListener('click', deleteInput);

    function deleteInput(e) {
        // make sure that we're not deleting the only input left
        if (button.count !== inputCounter) {
            inptGroup.remove();
            data.nodes = data.nodes.filter(node => node.id !== button.count);
            data.links = data.links.filter(link => !(link.source.id === button.count || link.target.id === button.count))
            Graph.graphData(data);
        }
    }


    const element = document.getElementById("step1-container");
    element.appendChild(inptGroup);
    inptGroup.appendChild(inpt);
    inptGroup.appendChild(button);

    // Event Listener To Create New Input
    inpt.addEventListener('input', updateValue);
    let inputCreated = false;

    function updateValue(e) {

        if (!inputCreated) {
            // make new input box
            inputCreated = true;
            data.nodes.push({
                id: button.count,
                name: e.target.value
            })
            Graph.graphData(data);
            createNewInput();
        } else {
            // update node
            let node = data.nodes.find(x => x.id === button.count);
            node.name = e.target.value;
            Graph.graphData(data);
        }
    }
}
function step1Next() {
    // check inputs
    let badState = new Set();
    for (let i = 0; i < data.nodes.length; i++) {
        // check for duplicate state names
        for (let j = i + 1; j < data.nodes.length; j++) {
            if (data.nodes[i].name === data.nodes[j].name) {
                badState.add(data.nodes[i].id);
                badState.add(data.nodes[j].id);
            }
        }
        // check for empty state names
        if (data.nodes[i].name.length === 0) {
            badState.add(data.nodes[i].id);
        }
    }
    const repeat = Array.from(badState);
    for (let i = 0; i < repeat.length; i++) {
        const element = document.getElementById('s-1-input-' + repeat[i]);
        element.className += " border border-danger"
    }

    if (repeat.length === 0 && data.nodes.length > 0) {
        // TODO: re-organize data.nodes
        step++;
        const element = document.getElementById("step1-container");
        element.style.display = "none";
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
        if (document.getElementById("openAccordionHeading-" + data.nodes[i].id) === null) {
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
            accordionButton.innerHTML = "Links to State " + data.nodes[i].name + ":"

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
        }

        for (let j = 0; j < data.nodes.length; j++) {
            if (document.getElementById("flexCheck" + data.nodes[i].id + "-" + data.nodes[j].id) === null) {
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
                input.onclick = function() {
                    if (input.checked) {
                        data.links.push({
                            source: data.nodes[i].id,
                            target: data.nodes[j].id,
                        })
                    } else {
                        data.links = data.links.filter(link => !(link.source.id === data.nodes[i].id && link.target.id === data.nodes[j].id));
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
    const step3 = document.getElementById("step3-container");
    step3.replaceChildren();

    for (let i = 0; i < data.links.length; i++) {
        const linkItem = document.createElement("div");
        linkItem.id = "link-item-" + data.links[i].source.id + "-" + data.links[i].target.id;

        const linkPar = document.createElement("p");
        linkPar.innerHTML = "Link from " + data.links[i].source.name + " to " + data.links[i].target.name + ":";

        const linkInputGroup = document.createElement("div");
        linkInputGroup.className = "input-group mb-3";
        linkInputGroup.id = "link-input-group-" + data.links[i].source.id + "-" + data.links[i].target.id;

        const linkInput = document.createElement("input");
        linkInput.type = "number";
        linkInput.className = "form-control";
        linkInput.placeholder = "Transition Rate";
        linkInput.ariaLabel = "Transition Rate";

        linkInput.addEventListener('input', updateValue);
        let inputCreated = false;

        function updateValue(e) {
            console.log(e.target.value);
        }

        step3.appendChild(linkItem);
        linkItem.appendChild(linkPar);
        linkItem.appendChild(linkInputGroup);
        linkInputGroup.appendChild(linkInput);
    }
}




// -------- STEP 4 --------