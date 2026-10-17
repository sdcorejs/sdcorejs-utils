import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'Dates, time zones, and DST', vi: 'Ngày, múi giờ và DST' },
  summary: {
    en: 'Choose an API by meaning, not by whichever date string happens to parse.',
    vi: 'Chọn API theo ý nghĩa dữ liệu, không theo chuỗi ngày nào tình cờ parse được.',
  },
  sections: [
    {
      anchor: 'three-time-concepts',
      title: { en: 'Three time concepts', vi: 'Ba khái niệm thời gian' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Time concepts', vi: 'Các khái niệm thời gian' }),
          localized(context.locale, { en: ['Concept', 'Example', 'Parser'], vi: ['Khái niệm', 'Ví dụ', 'Parser'] }),
          [
            [[localized(context.locale, { en: 'Local calendar date', vi: 'Ngày lịch cục bộ' })], [inlineCode('2026-07-20')], [inlineCode('parseLocalDateStrict')]],
            [[localized(context.locale, { en: 'Local wall-clock date-time', vi: 'Ngày giờ theo đồng hồ cục bộ' })], [inlineCode('2026-07-20T09:30:00')], [inlineCode('parseLocalDateTimeStrict')]],
            [[localized(context.locale, { en: 'Instant with offset', vi: 'Thời điểm có offset' })], [inlineCode('2026-07-20T09:30:00+07:00')], [inlineCode('parseInstant')]],
          ],
        ),
        callout(
          'info',
          localized(context.locale, { en: 'A date is not automatically an instant', vi: 'Ngày lịch không tự động là một thời điểm' }),
          paragraph(localized(context.locale, {
            en: 'Keep birthdays, billing dates, and other calendar values local unless the domain explicitly assigns a timezone and time of day.',
            vi: 'Giữ ngày sinh, ngày thanh toán và giá trị lịch khác ở dạng local trừ khi domain gán rõ múi giờ và thời gian trong ngày.',
          })),
        ),
        paragraph(localized(context.locale, {
          en: 'By default the helpers use the host local zone, so an instant can show a different day on another machine. Pass an IANA zone through TimeZoneOptions when every user must see the same wall clock.',
          vi: 'Mặc định các helper dùng múi giờ local của máy, nên một instant có thể hiện ngày khác trên máy khác. Truyền múi giờ IANA qua TimeZoneOptions khi mọi người dùng phải thấy cùng giờ đồng hồ.',
        })),
        bulletList([
          [inlineCode('toFormat'), ', ', inlineCode('parse'), ', ', inlineCode('parseFrom'), ', ', inlineCode('begin'), ', ', inlineCode('end'), localized(context.locale, { en: ' accept { timeZone }. Instants show the zone wall clock; zone-less and date-only strings keep their digits.', vi: ' nhận { timeZone }. Instant hiện theo giờ đồng hồ của múi giờ; chuỗi không có múi giờ và chuỗi chỉ có ngày giữ nguyên chữ số.' })],
          [inlineCode('toZonedParts'), ' / ', inlineCode('fromZonedParts'), localized(context.locale, { en: ' convert between an instant and zone fields. A repeated wall clock takes the earlier offset; a skipped one moves forward.', vi: ' chuyển qua lại giữa instant và các trường của múi giờ. Giờ đồng hồ lặp lại lấy offset sớm hơn; giờ bị bỏ qua dời về sau.' })],
          [inlineCode('MatchOptions.timeZone'), localized(context.locale, { en: ' resolves date-today, date-relative, and zone-less filter operands in the zone.', vi: ' tính date-today, date-relative và toán hạng filter không có múi giờ trong múi giờ đó.' })],
        ]),
        callout(
          'warning',
          localized(context.locale, { en: 'Use an IANA id, not a fixed offset', vi: 'Dùng id IANA, không dùng offset cố định' }),
          paragraph(localized(context.locale, {
            en: 'Asia/Ho_Chi_Minh was +08:00 from 1959-12-31 to 1975-06-13. A fixed +07:00 shows dates of that period on the wrong day, so isValidTimeZone rejects numeric offsets.',
            vi: 'Asia/Ho_Chi_Minh là +08:00 từ 1959-12-31 đến 1975-06-13. Offset cố định +07:00 hiện ngày của giai đoạn đó sai một ngày, nên isValidTimeZone từ chối offset số.',
          })),
        ),
        codeBlock(
          `const zone = { timeZone: 'Asia/Ho_Chi_Minh' };

DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy', zone); // '20/05/1960'
DateUtilities.parse('1960/05/20 08:00:00', zone); // 1960-05-20T00:00:00.000Z
DateUtilities.begin('1975/06/12', zone); // 1975-06-11T16:00:00.000Z (a 25-hour day)`,
          localized(context.locale, { en: 'Same wall clock on every host', vi: 'Cùng giờ đồng hồ trên mọi máy' }),
        ),
      ],
    },
    {
      anchor: 'strict-parsing',
      title: { en: 'Strict parsing', vi: 'Phân tích nghiêm ngặt' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Strict parsers reject impossible dates, incomplete formats, extra whitespace, and instants without Z or a numeric offset. Invalid input throws DateParseError rather than relying on host-locale parsing.',
          vi: 'Parser nghiêm ngặt từ chối ngày không tồn tại, format thiếu, khoảng trắng thừa và instant không có Z hoặc offset số. Input sai throw DateParseError thay vì dựa vào parser theo locale của host.',
        })),
        codeBlock(
          `import { DateUtilities, DateParseError } from '@sdcorejs/utils';

const localDate = DateUtilities.parseLocalDateStrict('2026-07-20');
const localTime = DateUtilities.parseLocalDateTimeStrict(
  '2026-07-20T09:30:00',
);
const instant = DateUtilities.parseInstant(
  '2026-07-20T09:30:00+07:00',
);

try {
  DateUtilities.parseLocalDateStrict('2026-02-30');
} catch (error: unknown) {
  if (!(error instanceof DateParseError)) throw error;
}`,
          localized(context.locale, { en: 'Parse by temporal meaning', vi: 'Parse theo ý nghĩa thời gian' }),
        ),
      ],
    },
    {
      anchor: 'dst-differences',
      title: { en: 'DST-safe differences', vi: 'Tính chênh lệch an toàn với DST' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Calendar-day and elapsed-time questions are different around daylight-saving transitions. Use the function whose unit matches the domain question.',
          vi: 'Câu hỏi về ngày lịch và thời gian đã trôi qua khác nhau tại thời điểm chuyển daylight saving. Hãy dùng hàm có đơn vị khớp câu hỏi của domain.',
        })),
        bulletList([
          [inlineCode('calendarDayDifference'), localized(context.locale, { en: ' compares local calendar days and stays stable across DST.', vi: ' so sánh ngày lịch cục bộ và ổn định qua DST.' })],
          [inlineCode('elapsedDayDifference'), localized(context.locale, { en: ' divides actual elapsed milliseconds by 24 hours.', vi: ' chia số mili giây thực tế đã trôi qua cho 24 giờ.' })],
          [inlineCode('completedYearDifference'), localized(context.locale, { en: ' returns completed calendar years.', vi: ' trả về số năm lịch đã hoàn thành.' })],
          [inlineCode('completedAge'), localized(context.locale, { en: ' applies completed-year semantics to a birth date.', vi: ' áp dụng semantics năm hoàn thành cho ngày sinh.' })],
        ]),
      ],
    },
    {
      anchor: 'calendar-arithmetic',
      title: { en: 'Calendar arithmetic', vi: 'Phép toán lịch' },
      render: (context) => [
        paragraph(
          inlineCode('addMonths'),
          localized(context.locale, {
            en: ' defaults to constrained end-of-month behavior. Its overflow policy can be ',
            vi: ' mặc định giữ ngày trong giới hạn cuối tháng. Chính sách overflow có thể là ',
          }),
          inlineCode("'constrain'"),
          ', ',
          inlineCode("'balance'"),
          localized(context.locale, { en: ', or ', vi: ' hoặc ' }),
          inlineCode("'reject'"),
          '.',
        ),
        codeBlock(
          `const january31 = DateUtilities.parseLocalDateStrict('2026-01-31');

const constrained = DateUtilities.addMonths(january31, 1);
const rejected = DateUtilities.addMonths(
  january31,
  1,
  { overflow: 'reject' },
);`,
          localized(context.locale, { en: 'Explicit month overflow', vi: 'Overflow tháng tường minh' }),
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Legacy names can be ambiguous', vi: 'Tên legacy có thể mơ hồ' }),
          paragraph(
            inlineCode('dayDiff'), ', ', inlineCode('yearDiff'), ', ', inlineCode('age'),
            localized(context.locale, { en: ', and the misspelled ', vi: ' và tên viết sai ' }),
            inlineCode('addMiliseconds'),
            localized(context.locale, { en: ' are deprecated. Prefer the explicit APIs above.', vi: ' đã deprecated. Ưu tiên các API tường minh ở trên.' }),
          ),
        ),
      ],
    },
  ],
});
