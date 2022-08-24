import React, { Component } from 'react'

import ForceGraph2D from 'react-force-graph-2d';

export class GraphEditor extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: undefined,
        }
    }

    componentDidMount() {
        var testData = require('../data/testData.json')

        this.setState({data: testData})

        setTimeout(() => {
            this.setState({data: {
                nodes: [...this.state.data.nodes, {
                    "id": "curt",
                    "name": "curt"
                }],
                links: this.state.data.links
            }})
        }, 5000)
    }

    render() {
        return (
        <div className="graphEditor">
            <ForceGraph2D 
                width={window.innerWidth * 0.8} 
                height={window.innerHeight * 0.7} 
                graphData={this.state.data} 
                nodeRelSize={5} 
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 18 / globalScale;
                    ctx.fillStyle = "black";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.font = `${fontSize}px Sans-Serif`
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 36 / globalScale, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fillText(label, node.x, node.y);
                }}
                linkCanvasObject={(link, ctx, globalScale) => {
                    ctx.beginPath();
                    ctx.moveTo(link.source.x, link.source.y);
                    ctx.lineTo(link.target.x, link.target.y);
                    ctx.stroke();
                }}
                linkWidth={5}
                minZoom={1}
                maxZoom={5}
                />
        </div>
        )
    }
}

export default GraphEditor