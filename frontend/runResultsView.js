import PropTypes from 'prop-types';
import React from 'react';

import { AlignmentsTab } from './alignmentsTab.js';
import { BeamSearchOutputView } from './beamSearchOutputView.js';
import { CaptionsTab } from './captionsTab.js';

export { RunResultsView, HomeTabResultsView };

function HomeTabResultsView(props) {
    return (
        <div className="homeTabResultsView">
            <RunResultsView
                results={props.results}
                instanceId={props.instanceId}
                runId={props.runId}
                onCaptionClick={props.onCaptionClick}
                fetchAttentionMap={props.fetchAttentionMap}
                fetchAttentionMapForBSToken={props.fetchAttentionMapForBSToken}
                metrics={props.metrics}
                graph={props.graph}
            />
        </div>
    );
}

class RunResultsView extends React.Component {
    constructor(props) {
        super(props);

        this.getCaption = this.getCaption.bind(this);
        this.getSelectedCaption = this.getSelectedCaption.bind(this);
        this.setInitialCapID = this.setInitialCapID.bind(this);
        this.handleCaptionChange = this.handleCaptionChange.bind(this);
        this.fetchBeamSearchGraph = this.fetchBeamSearchGraph.bind(this);
        this.fetchAttentionURLs = this.fetchAttentionURLs.bind(this);
        
        this.hasAttn = false;
        this.hasBS = this.props.results.beamSearch.captions.length > 0 ? true : false;
        this.hasGraph = this.props.results.beamSearch.hasGraph;
        this.runId = this.props.runId;


        const cid = this.setInitialCapID();
        this.fetchAttentionURLs(cid);

        this.state = {
            showAlignments: false,
            showCaption: true,
            showBSOut: false,
            showMetrics: false,
            captionId: cid,
            bsGraph: null,
            urls: [],
        };

        if (this.props.graph === undefined && this.hasGraph)
            this.fetchBeamSearchGraph();
    }

    render() {
        if (this.runId !== this.props.runId) {
            this.runId = this.props.runId;
            this.fetchAttentionURLs(this.state.captionId);
        }

        const caption = this.getSelectedCaption();
        const cid = this.state.captionId;
        
        const switchState = b => {
            let s = this.state;
            s[b] = !s[b];
            this.setState(s);
        };

        const r = this.props.results;

        let captionTab = !this.state.showCaption ? null :
            <CaptionsTab
                greedyCaption={r.greedy.caption}
                beamSearchCaptions={r.beamSearch.captions}
                onTokenClick={(c, t) => this.props.onCaptionClick(c, t)}
            />;

        let attTab = !this.state.showAlignments ? null :
            <AlignmentsTab 
                greedyCaption={r.greedy.caption}
                beamSearchCaptions={r.beamSearch.captions}
                runId={this.props.runId}
                instanceId={this.props.instanceId}
            />;

        let bsView = !this.state.showBSOut ? null :
            <BeamSearchOutputView 
                graph={this.props.graph ? this.props.graph : this.state.bsGraph}
                displayAlignment={a => this.props.fetchAttentionMapForBSToken(a)}
            />;

        return (
            <div>
                <div>
                    <span className="resultsSpan" onClick={() => switchState('showCaption')}>
                        Captions
                    </span>
                    {captionTab}
                </div>

                <div id="alignments">
                    <span className="resultsSpan" onClick={() => switchState('showAlignments')}>
                        Alignments
                    </span>
                    {attTab}
                </div>
                
                <div id="beamSearch">
                    <span className="resultsSpan" onClick={() => switchState('showBSOut')}>
                        Beam Search Output Graph
                    </span>
                    {bsView}
                </div>

            </div>
        );
    }

    getCaption(cid) {
        if (cid == 0) {
            return this.props.results.greedy.caption;
        } else if (cid > 0) {
            return this.props.results.beamSearch.captions[cid - 1];
        } else {
            return null;
        }
    }

    // returns the currently selected caption as an array of string tokens.
    getSelectedCaption() {
        const cid = this.state.captionId;
        return this.getCaption(cid);
    }

    // sets the initially chosen caption. defaults to greedy, if it's not present
    // choose the first beam search hypothesis, if neither is present, return null.
    setInitialCapID() {
        const res = this.props.results;
        const greedyCap = res.greedy.caption;
        const bsCaps = res.beamSearch.captions;
        if (bsCaps !== null && bsCaps.length > 0)
            return 1;
        if (greedyCap !== null && greedyCap.length > 0)
            return 0;
        return null;
    }

    fetchAttentionURLs(cid) {
        if (cid === 0 && this.props.results.greedy.hasAttn)
            this.hasAttn = true;
        else if (cid === 0)
            this.hasAttn = false;
        if (cid > 0 && this.props.results.greedy.hasAttn)
            this.hasAttn = true;
        else if (cid > 0)
            this.hasAttn = false;
        
        if (!this.hasAttn)
            return;

        const runId = this.props.runId;
        const instanceId = this.props.instanceId;
        const cap = this.getCaption(cid);
        this.setState({ urls: Array(cap.length) });
        
        for (let i = 0; i < cap.length; i++) {
            const j = i;
            this.props.fetchAttentionMap(runId, instanceId, cid, i)
            .then(url => {
                let s = this.state;
                s.urls[j] = url;
                this.setState(s);
            });
        }
    }

    handleCaptionChange(cid) {
        this.fetchAttentionURLs(cid);
        this.setState({ captionId: cid });
    }

    fetchBeamSearchGraph() {
        return fetch(`/load_bs_graph/${this.props.runId}/${this.props.instanceId}`)
        .then(res => res.json())
        .then(res => {
            this.setState({ bsGraph: res });
        });
    }
}

RunResultsView.propTypes = {
    results: PropTypes.object,

    instanceId: PropTypes.number.isRequired,
    runId: PropTypes.number.isRequired,
    
    onCaptionClick: PropTypes.func.isRequired,
    fetchAttentionMap: PropTypes.func.isRequired,
    fetchAttentionMapForBSToken: PropTypes.func.isRequired,

    metrics: PropTypes.arrayOf(PropTypes.string).isRequired,
    graph: PropTypes.object
};

// results = {
//     greedy: {
//         caption: [],
//         alignmnets: [],
//         hasAttn: true
//     },
//     beamSearch: {
//         captions: [[]],
//         alignments: [[]],
//         hasAttn: true,
//         graph: null,
//         hasGraph: false
//     }
// }