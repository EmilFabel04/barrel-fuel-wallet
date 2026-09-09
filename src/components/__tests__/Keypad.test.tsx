import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Keypad } from '../Keypad';

describe('Keypad', () => {
  test('stops at seven characters by default, as a rand amount', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(<Keypad value="1234567" onChange={onChange} />);

    fireEvent.press(getByLabelText('8'));

    expect(onChange).toHaveBeenCalledWith('1234567');
  });

  // A phone number is ten digits, so the rand-shaped cap has to be a parameter
  // rather than a constant baked into the component.
  test('accepts a longer value when given a maxLength', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <Keypad value="1234567" onChange={onChange} maxLength={10} />
    );

    fireEvent.press(getByLabelText('8'));

    expect(onChange).toHaveBeenCalledWith('12345678');
  });

  test('drops a leading zero by default, so an amount never reads 042', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(<Keypad value="0" onChange={onChange} />);

    fireEvent.press(getByLabelText('8'));

    expect(onChange).toHaveBeenCalledWith('8');
  });

  // Every South African mobile number starts with one, so the amount-shaped
  // behaviour above would eat the first digit the user types.
  test('keeps a leading zero when told to', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <Keypad value="0" onChange={onChange} maxLength={10} allowLeadingZero />
    );

    fireEvent.press(getByLabelText('8'));

    expect(onChange).toHaveBeenCalledWith('08');
  });

  test('deletes from the end regardless of the cap', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <Keypad value="0821" onChange={onChange} maxLength={10} />
    );

    fireEvent.press(getByLabelText('Delete'));

    expect(onChange).toHaveBeenCalledWith('082');
  });
});
