import { fireEvent, render, screen } from '@testing-library/react';
import PinInput from './PinInput';

describe('PinInput component', () => {
  it('renders 4 input boxes by default when length is 4', () => {
    render(<PinInput length={4} onChange={() => {}} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
  });

  it('calls onChange with assembled PIN when all digits are filled', () => {
    const handleChange = jest.fn();

    render(<PinInput length={4} onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });

    expect(handleChange).toHaveBeenCalledWith('1234');
  });

  it('only accepts numeric input', () => {
    const handleChange = jest.fn();

    render(<PinInput length={4} onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(handleChange).not.toHaveBeenCalledWith(expect.stringContaining('a'));
  });
});
