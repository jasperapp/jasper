import React, {ReactNode} from 'react';
import {DragDropContext, Droppable, Draggable, DropResult} from 'react-beautiful-dnd';

type Props = {
  nodes: ReactNode[];
  onDragStart: () => void;
  onDragCancel: () => void;
  onDragEnd: (sourceIndex: number, destIndex: number) => void;
}

type State = {
}

// https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/about/examples.md#basic-samples
// https://codesandbox.io/s/k260nyxq9v?file=/index.js
export class DraggableList extends React.Component<Props, State> {
  private handleDragStart() {
    this.props.onDragStart();
  }

  private handleDragEnd(result: DropResult) {
    if (!result.destination) {
      this.props.onDragCancel();
      return;
    }

    this.props.onDragEnd(result.source.index, result.destination.index);
  }

  render() {
    return (
      <DragDropContext
        onDragStart={() => this.handleDragStart()}
        onDragEnd={result => this.handleDragEnd(result)}
      >
        <Droppable droppableId='droppable'>
          {(provided, _snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {this.renderNodes()}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  private renderNodes() {
    return this.props.nodes.map((node, index) => this.renderNode(node, index))
  }

  private renderNode(child: ReactNode, index: number) {
    return (
      <Draggable key={index} draggableId={index.toString()} index={index}>
        {(provided, _snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {child}
          </div>
        )}
      </Draggable>
    );
  }
}
