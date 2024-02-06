import React from 'react';
import { DatePicker } from 'antd';

const TimePickerDay = React.forwardRef((props, ref) => {
  return <DatePicker {...props} picker="time" mode={undefined} ref={ref} />;
});

TimePickerDay.displayName = 'TimePicker';

export default TimePickerDay;
