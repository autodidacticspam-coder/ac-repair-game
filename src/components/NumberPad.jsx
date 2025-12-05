import './NumberPad.css';

export default function NumberPad({ onNumber, onClear, onBackspace, onSubmit }) {
  return (
    <div className="number-pad">
      <div className="number-row">
        <button onClick={() => onNumber('7')}>7</button>
        <button onClick={() => onNumber('8')}>8</button>
        <button onClick={() => onNumber('9')}>9</button>
      </div>
      <div className="number-row">
        <button onClick={() => onNumber('4')}>4</button>
        <button onClick={() => onNumber('5')}>5</button>
        <button onClick={() => onNumber('6')}>6</button>
      </div>
      <div className="number-row">
        <button onClick={() => onNumber('1')}>1</button>
        <button onClick={() => onNumber('2')}>2</button>
        <button onClick={() => onNumber('3')}>3</button>
      </div>
      <div className="number-row">
        <button onClick={onClear} className="clear-btn">C</button>
        <button onClick={() => onNumber('0')}>0</button>
        <button onClick={onBackspace} className="back-btn">←</button>
      </div>
      <button onClick={onSubmit} className="submit-btn">
        Check Answer
      </button>
    </div>
  );
}
