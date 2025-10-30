import { useState, useEffect, useRef } from 'react';
import { Grid, findPathAStar } from '../utils/pathfinding';
import './GridVisualizer.css';

const CELL_SIZE = 25;
const DEFAULT_WIDTH = 30;
const DEFAULT_HEIGHT = 20;

function GridVisualizer() {
  const [grid, setGrid] = useState(null);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: DEFAULT_WIDTH - 1, y: DEFAULT_HEIGHT - 1 });
  const [path, setPath] = useState([]);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [density, setDensity] = useState(0.7);
  const [searchComplete, setSearchComplete] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const [mode, setMode] = useState('start'); // 'start', 'end', 'wall'

  useEffect(() => {
    generateGrid();
  }, []);

  const generateGrid = () => {
    const newGrid = new Grid(DEFAULT_WIDTH, DEFAULT_HEIGHT, density);

    // Ensure start and end are walkable
    newGrid.getNode(start.x, start.y).isWalkable = true;
    newGrid.getNode(end.x, end.y).isWalkable = true;

    setGrid(newGrid);
    setPath([]);
    setVisitedNodes([]);
    setSearchComplete(false);
    setPathLength(0);
  };

  const runPathfinding = async () => {
    if (!grid || isSearching) return;

    setIsSearching(true);
    setPath([]);
    setVisitedNodes([]);
    setSearchComplete(false);
    setPathLength(0);

    // Visualization callback
    const onVisit = async (visited, currentPath, isComplete) => {
      setVisitedNodes([...visited]);
      if (currentPath.length > 0) {
        setPath([...currentPath]);
        setPathLength(currentPath.length);
      }

      if (!isComplete) {
        // Delay for visualization
        await new Promise(resolve => setTimeout(resolve, 10));
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

  const handleCellClick = (x, y) => {
    if (isSearching) return;

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
        return; // Don't allow placing walls on start/end
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

  const handleDensityChange = (e) => {
    setDensity(parseFloat(e.target.value));
  };

  if (!grid) return <div>Loading...</div>;

  return (
    <div className="visualizer-container">
      <div className="header">
        <h1>🎯 A* Pathfinding Görselleştirici</h1>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Mod:</label>
          <div className="button-group">
            <button
              className={mode === 'start' ? 'active' : ''}
              onClick={() => setMode('start')}
              disabled={isSearching}
            >
              🟢 Başlangıç Seç
            </button>
            <button
              className={mode === 'end' ? 'active' : ''}
              onClick={() => setMode('end')}
              disabled={isSearching}
            >
              🔴 Bitiş Seç
            </button>
            <button
              className={mode === 'wall' ? 'active' : ''}
              onClick={() => setMode('wall')}
              disabled={isSearching}
            >
              🧱 Duvar Çiz
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Koridor Yoğunluğu: {(density * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0.3"
            max="0.9"
            step="0.05"
            value={density}
            onChange={handleDensityChange}
            disabled={isSearching}
          />
        </div>

        <div className="button-group">
          <button
            className="primary"
            onClick={runPathfinding}
            disabled={isSearching}
          >
            {isSearching ? '🔍 Aranıyor...' : '▶️ Yolu Bul'}
          </button>
          <button
            onClick={generateGrid}
            disabled={isSearching}
          >
            🔄 Yeni Grid
          </button>
        </div>
      </div>

      {searchComplete && (
        <div className="status">
          {path.length > 0 ? (
            <div className="success">
              ✅ Yol bulundu! Uzunluk: <strong>{pathLength}</strong> adım
            </div>
          ) : (
            <div className="error">
              ❌ Yol bulunamadı!
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
        >
          {grid.nodes.map((row, y) =>
            row.map((node, x) => (
              <div
                key={`${x}-${y}`}
                className={getCellClass(x, y)}
                onClick={() => handleCellClick(x, y)}
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
