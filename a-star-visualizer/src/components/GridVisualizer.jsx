import { useState, useEffect, useRef } from 'react';
import { Grid, findPathAStar } from '../utils/pathfinding';
import './GridVisualizer.css';

const CELL_SIZE = 20;
const DEFAULT_WIDTH = 41;
const DEFAULT_HEIGHT = 31;

function GridVisualizer() {
  const [grid, setGrid] = useState(null);
  const [start, setStart] = useState({ x: 1, y: 1 });
  const [end, setEnd] = useState({ x: DEFAULT_WIDTH - 2, y: DEFAULT_HEIGHT - 2 });
  const [path, setPath] = useState([]);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const [mode, setMode] = useState('wall');
  const [mazeType, setMazeType] = useState('easy');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    generateGrid('easy');
  }, []);

  const generateGrid = (type) => {
    const newGrid = new Grid(DEFAULT_WIDTH, DEFAULT_HEIGHT, type);

    // Ensure start and end are walkable
    newGrid.getNode(start.x, start.y).isWalkable = true;
    newGrid.getNode(end.x, end.y).isWalkable = true;

    setGrid(newGrid);
    setPath([]);
    setVisitedNodes([]);
    setSearchComplete(false);
    setPathLength(0);
    setMazeType(type);
  };

  const runPathfinding = async () => {
    if (!grid || isSearching) return;

    setIsSearching(true);
    setPath([]);
    setVisitedNodes([]);
    setSearchComplete(false);
    setPathLength(0);

    const onVisit = async (visited, currentPath, isComplete) => {
      setVisitedNodes([...visited]);
      if (currentPath.length > 0) {
        setPath([...currentPath]);
        setPathLength(currentPath.length);
      }

      if (!isComplete) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    };

    const result = await findPathAStar(grid, start, end, onVisit);

    if (result) {
      setPath(result);
      setPathLength(result.length);
    }

    setSearchComplete(true);
    setIsSearching(false);
  };

  const handleCellMouseDown = (x, y) => {
    if (isSearching) return;
    setIsDrawing(true);
    handleCellInteraction(x, y);
  };

  const handleCellMouseEnter = (x, y) => {
    if (!isDrawing || isSearching) return;
    handleCellInteraction(x, y);
  };

  const handleCellMouseUp = () => {
    setIsDrawing(false);
  };

  const handleCellInteraction = (x, y) => {
    if (mode === 'start') {
      setStart({ x, y });
      if (grid) {
        grid.getNode(x, y).isWalkable = true;
      }
    } else if (mode === 'end') {
      setEnd({ x, y });
      if (grid) {
        grid.getNode(x, y).isWalkable = true;
      }
    } else if (mode === 'wall') {
      if ((x === start.x && y === start.y) || (x === end.x && y === end.y)) {
        return;
      }
      const node = grid.getNode(x, y);
      node.isWalkable = !node.isWalkable;
      setGrid({ ...grid });
    }

    setPath([]);
    setVisitedNodes([]);
    setSearchComplete(false);
  };

  const getCellClass = (x, y) => {
    const classes = ['cell'];

    if (!grid) return classes.join(' ');

    const node = grid.getNode(x, y);

    if (x === start.x && y === start.y) {
      classes.push('start');
    } else if (x === end.x && y === end.y) {
      classes.push('end');
    } else if (path.some(p => p.x === x && p.y === y)) {
      classes.push('path');
    } else if (visitedNodes.some(v => v.x === x && v.y === y)) {
      classes.push('visited');
    } else if (!node.isWalkable) {
      classes.push('wall');
    } else {
      classes.push('walkable');
    }

    return classes.join(' ');
  };

  if (!grid) return <div>Loading...</div>;

  return (
    <div className="visualizer-container">
      <div className="header">
        <h1>A* Pathfinding Algorithm</h1>
        <p className="subtitle">by BeyondX</p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Labirent Seçin:</label>
          <div className="button-group">
            <button
              onClick={() => generateGrid('easy')}
              disabled={isSearching}
              className={mazeType === 'easy' ? 'active' : ''}
            >
              Kolay
            </button>
            <button
              onClick={() => generateGrid('medium')}
              disabled={isSearching}
              className={mazeType === 'medium' ? 'active' : ''}
            >
              Orta
            </button>
            <button
              onClick={() => generateGrid('hard')}
              disabled={isSearching}
              className={mazeType === 'hard' ? 'active' : ''}
            >
              Zor
            </button>
            <button
              onClick={() => generateGrid('random')}
              disabled={isSearching}
              className={mazeType === 'random' ? 'active' : ''}
            >
              Random
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Mod:</label>
          <div className="button-group">
            <button
              className={mode === 'start' ? 'active' : ''}
              onClick={() => setMode('start')}
              disabled={isSearching}
            >
              Başlangıç
            </button>
            <button
              className={mode === 'end' ? 'active' : ''}
              onClick={() => setMode('end')}
              disabled={isSearching}
            >
              Bitiş
            </button>
            <button
              className={mode === 'wall' ? 'active' : ''}
              onClick={() => setMode('wall')}
              disabled={isSearching}
            >
              Duvar
            </button>
          </div>
        </div>

        <div className="button-group">
          <button
            className="primary"
            onClick={runPathfinding}
            disabled={isSearching}
          >
            {isSearching ? 'Aranıyor...' : 'Yolu Bul'}
          </button>
        </div>
      </div>

      {searchComplete && (
        <div className="status">
          {path.length > 0 ? (
            <div className="success">
              Yol bulundu! Uzunluk: <strong>{pathLength}</strong> adım
            </div>
          ) : (
            <div className="error">
              Yol bulunamadı!
            </div>
          )}
        </div>
      )}

      <div className="grid-container">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${grid.width}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${grid.height}, ${CELL_SIZE}px)`,
          }}
          onMouseLeave={handleCellMouseUp}
        >
          {grid.nodes.map((row, y) =>
            row.map((node, x) => (
              <div
                key={`${x}-${y}`}
                className={getCellClass(x, y)}
                onMouseDown={() => handleCellMouseDown(x, y)}
                onMouseEnter={() => handleCellMouseEnter(x, y)}
                onMouseUp={handleCellMouseUp}
                title={`(${x}, ${y})`}
              />
            ))
          )}
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-box start"></div>
          <span>Başlangıç</span>
        </div>
        <div className="legend-item">
          <div className="legend-box end"></div>
          <span>Bitiş</span>
        </div>
        <div className="legend-item">
          <div className="legend-box path"></div>
          <span>Yol</span>
        </div>
        <div className="legend-item">
          <div className="legend-box visited"></div>
          <span>Ziyaret Edilen</span>
        </div>
        <div className="legend-item">
          <div className="legend-box walkable"></div>
          <span>Koridor</span>
        </div>
        <div className="legend-item">
          <div className="legend-box wall"></div>
          <span>Duvar</span>
        </div>
      </div>
    </div>
  );
}

export default GridVisualizer;
