import { proto } from '../../../WAProto'
import { Dugong } from '../../Socket/dugong.js'

const makeDugong = () =>
	new Dugong(
		async () => ({ mediaUrl: '', directPath: '' }),
		async () => 'message-id',
		{},
		{ authState: { creds: { me: { id: '123@s.whatsapp.net' } } } }
	)

describe('Dugong', () => {
	it('detects Ourin interactive and rich payload families', () => {
		const dugong = makeDugong()

		expect(dugong.detectType({ requestPaymentMessage: {} })).toBe('PAYMENT')
		expect(dugong.detectType({ interactiveMessage: { carouselMessage: {} } })).toBe('CAROUSEL')
		expect(dugong.detectType({ interactiveMessage: {} })).toBe('INTERACTIVE')
		expect(dugong.detectType({ interactiveButtons: {} })).toBe('INTERACTIVE_BUTTONS')
		expect(dugong.detectType({ pollResultMessage: {} })).toBe('POLL_RESULT')
		expect(dugong.detectType({ unknownPayload: {} })).toBeNull()
	})

	it('converts a payment request into the RC14 protobuf message shape', async () => {
		const dugong = makeDugong()
		const payment = await dugong.handlePayment(
			{
				requestPaymentMessage: { amount: 2500, currency: 'IDR', from: '123@s.whatsapp.net', note: 'Invoice' }
			},
			undefined
		)
		const decoded = proto.Message.RequestPaymentMessage.create(payment.requestPaymentMessage)

		expect(decoded.amount1000?.toString()).toBe('2500')
		expect(decoded.currencyCodeIso4217).toBe('IDR')
		expect(decoded.requestFrom).toBe('123@s.whatsapp.net')
		expect(decoded.noteMessage?.extendedTextMessage?.text).toBe('Invoice')
	})
})
