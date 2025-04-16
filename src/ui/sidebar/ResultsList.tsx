import React, { useState, useMemo, memo } from 'react';
import { ASTNode } from '../../core/services/tdParser/types';

type NodeType = 'section' | 'task';

interface ResultsListProps {
	node: ASTNode;
}

const ResultsList: React.FC<ResultsListProps> = memo(({ node }) => {
	const children = useMemo(() => filterValidChildren(node), [node.children]);
	return (
		<ul id='resultsList'>
			{children.map(child => (
				<ResultItem key={child.id} node={child} isChildOfRoot={true} />
			))}
		</ul>
	);
});

interface ResultItemProps {
	node: ASTNode;
	isChildOfRoot?: boolean;
}

const ResultItem: React.FC<ResultItemProps> = memo(({ node, isChildOfRoot }) => {
	const children = useMemo(() => filterValidChildren(node), [node.children]);

	const marginLeft = isChildOfRoot ? "0" : "18px";

	if (node.type === 'section') {
		return (
			<li className="tree-section" style={{ marginLeft }}>
				<span className="tree-section-text">{node.text}</span>
				{children.length > 0 && (
					<ul>
						{children.map(child => (
							<ResultItem key={child.id} node={child} isChildOfRoot={false} />
						))}
					</ul>
				)}
			</li>
		);
	}

	if (node.type === 'task') {
		const { priority, status, meta, notes, text } = node;
		const [showTooltip, setShowTooltip] = useState(false);

		const { hasMeta, hasNotes, metaLine, notesText } = useMemo(() => {
			const hasMeta = !!meta && Object.keys(meta).length > 0;
			const hasNotes = !!notes && notes.length > 0;
			const metaLine = hasMeta
				? Object.entries(meta)
					.map(([k, v]) => (v ? `@${k}:${v}` : `@${k}`))
					.join(', ')
				: '';
			const notesText = hasNotes ? notes.map(n => n.text).join('\n') : '';
			return { hasMeta, hasNotes, metaLine, notesText };
		}, [meta, notes]);

		return (
			<li className="tree-task" style={{ marginLeft }}>
				<div
					className="tree-task-row"
					onMouseEnter={() => setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
				>
					<span
						className="tree-rhombus"
						style={{ color: getRhombusColor(priority, status) }}
					>
						<svg width="6" height="6" viewBox="0 0 6 6" style={{ display: 'block' }}>
							<rect x="0" y="0" width="6" height="6" fill="currentColor" transform="rotate(45 2 2)" />
						</svg>
					</span>
					{hasNotes && <span className="tree-note-icon">✏️</span>}
					{hasMeta && <span className="tree-meta-icon">@</span>}
					<span className="tree-task-text">{text}</span>
					{(hasMeta || hasNotes) && showTooltip && (
						<div className="tree-tooltip">
							{hasMeta && <div className="tree-tooltip-meta">{metaLine}</div>}
							{hasMeta && hasNotes && <br />}
							{hasNotes && <div className="tree-tooltip-notes">{notesText}</div>}
						</div>
					)}
				</div>
				{children.length > 0 && (
					<ul>
						{children.map(child => (
							<ResultItem key={child.id} node={child} isChildOfRoot={false} />
						))}
					</ul>
				)}
			</li>
		);
	}

	return null;
});

// Helpers

function isRenderable(node: ASTNode): node is ASTNode & { type: NodeType } {
	return node.type === 'section' || node.type === 'task';
}

function filterValidChildren(node: ASTNode): ASTNode[] {
	return node.children?.filter(isRenderable) || [];
}

function getRhombusColor(priority?: string, status?: string): string {
	if (status === 'done') return '#bdbdbd';
	if (priority === 'high') return '#e53935';
	if (priority === 'medium') return '#ff9800';
	if (priority === 'low') return '#fff';
	return '#bdbdbd';
}

export default ResultsList;