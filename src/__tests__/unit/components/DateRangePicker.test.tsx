import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from '@/components/shared/DateRangePicker';

/** Convert a YYYY-MM-DD string to a local Date (avoids UTC-offset midnight issues). */
function toDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function setup(overrides: Partial<React.ComponentProps<typeof DateRangePicker>> = {}) {
  const rawStart = overrides.startDate ?? toDate('2024-01-01');
  const rawEnd = overrides.endDate ?? toDate('2024-01-31');
  const props = {
    startDate: rawStart,
    endDate: rawEnd,
    onStartChange: vi.fn(),
    onEndChange: vi.fn(),
    onApply: vi.fn(),
    ...overrides,
  };
  const result = render(<DateRangePicker {...props} />);
  return { ...result, props };
}

describe('DateRangePicker', () => {
  // ── Labels & structure ──────────────────────────────────────────────────────

  it('renders a "Start date" label linked to the start input', () => {
    setup();
    const input = screen.getByLabelText('Start date');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('renders an "End date" label linked to the end input', () => {
    setup();
    const input = screen.getByLabelText('End date');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('renders an Apply button', () => {
    setup();
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });

  // ── Controlled value binding ────────────────────────────────────────────────

  it('reflects startDate prop in the start input', () => {
    setup({ startDate: toDate('2024-03-01') });
    expect(screen.getByLabelText('Start date')).toHaveValue('2024-03-01');
  });

  it('reflects endDate prop in the end input', () => {
    setup({ endDate: toDate('2024-03-31') });
    expect(screen.getByLabelText('End date')).toHaveValue('2024-03-31');
  });

  // ── onStartChange / onEndChange callbacks ───────────────────────────────────

  it('calls onStartChange when start input changes', async () => {
    const user = userEvent.setup();
    const { props } = setup({ startDate: undefined });
    await user.type(screen.getByLabelText('Start date'), '2024-06-01');
    expect(props.onStartChange).toHaveBeenCalled();
  });

  it('calls onEndChange when end input changes', async () => {
    const user = userEvent.setup();
    const { props } = setup({ endDate: undefined });
    await user.type(screen.getByLabelText('End date'), '2024-06-30');
    expect(props.onEndChange).toHaveBeenCalled();
  });

  // ── Valid Apply ─────────────────────────────────────────────────────────────

  it('calls onApply when end ≥ start', async () => {
    const user = userEvent.setup();
    const { props } = setup({ startDate: toDate('2024-01-01'), endDate: toDate('2024-01-31') });
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  it('calls onApply when start equals end (same-day range is valid)', async () => {
    const user = userEvent.setup();
    const { props } = setup({ startDate: toDate('2024-06-15'), endDate: toDate('2024-06-15') });
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  // ── Invalid Apply (end < start) ─────────────────────────────────────────────

  it('does NOT call onApply when end < start', async () => {
    const user = userEvent.setup();
    const { props } = setup({ startDate: toDate('2024-06-15'), endDate: toDate('2024-06-01') });
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(props.onApply).not.toHaveBeenCalled();
  });

  it('shows an inline error message when end < start', async () => {
    const user = userEvent.setup();
    setup({ startDate: toDate('2024-06-15'), endDate: toDate('2024-06-01') });
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/end date must be/i);
  });

  // ── External error prop ─────────────────────────────────────────────────────

  it('displays the external error prop text', () => {
    setup({ error: 'Date range exceeds 90 days' });
    expect(screen.getByRole('alert')).toHaveTextContent('Date range exceeds 90 days');
  });

  it('does not render an alert element when there is no error', () => {
    setup();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── aria-describedby linkage ────────────────────────────────────────────────

  it('links both inputs to the error element via aria-describedby when error is shown', async () => {
    const user = userEvent.setup();
    setup({ startDate: toDate('2024-06-15'), endDate: toDate('2024-06-01') });
    await user.click(screen.getByRole('button', { name: /apply/i }));

    const alert = screen.getByRole('alert');
    const alertId = alert.getAttribute('id');
    expect(alertId).toBeTruthy();

    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    expect(startInput).toHaveAttribute('aria-describedby', alertId!);
    expect(endInput).toHaveAttribute('aria-describedby', alertId!);
  });

  it('removes aria-describedby from inputs when there is no error', () => {
    setup({ startDate: toDate('2024-01-01'), endDate: toDate('2024-01-31') });
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    expect(startInput).not.toHaveAttribute('aria-describedby');
    expect(endInput).not.toHaveAttribute('aria-describedby');
  });

  // ── Disabled state ──────────────────────────────────────────────────────────

  it('disables both inputs and the Apply button when disabled=true', () => {
    setup({ disabled: true });
    expect(screen.getByLabelText('Start date')).toBeDisabled();
    expect(screen.getByLabelText('End date')).toBeDisabled();
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
  });

  it('does not disable any controls when disabled=false', () => {
    setup({ disabled: false });
    expect(screen.getByLabelText('Start date')).not.toBeDisabled();
    expect(screen.getByLabelText('End date')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /apply/i })).not.toBeDisabled();
  });

  // ── Error clears after fixing inputs ───────────────────────────────────────

  it('clears the internal error when the start input changes', async () => {
    const user = userEvent.setup();
    // First trigger an error
    const { rerender, props } = setup({ startDate: toDate('2024-06-15'), endDate: toDate('2024-06-01') });
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Simulate parent updating startDate to fix the range; also triggers onChange clearing internal error
    rerender(
      <DateRangePicker
        {...props}
        startDate={toDate('2024-05-01')}
        endDate={toDate('2024-06-01')}
        onStartChange={props.onStartChange}
        onEndChange={props.onEndChange}
        onApply={props.onApply}
      />
    );
    // Change the start input to fire the onChange handler that clears internal error
    await user.clear(screen.getByLabelText('Start date'));
    // After onChange, internalError should be null and no external error exists
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
