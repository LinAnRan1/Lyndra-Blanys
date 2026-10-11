import { MIN_UPLOAD_INTERVAL } from '../../Defaults'
import { getAdditionalNode, getBinaryNodeFilter } from '../../WABinary'

describe('Ourin binary helpers', () => {
	it('creates business metadata nodes for native-flow button families', () => {
		const [node] = getAdditionalNode('cta_catalog')
		expect(node?.tag).toBe('biz')
		expect(node?.attrs.actual_actors).toBe('2')
		const interactive = Array.isArray(node?.content) ? node.content[1] : undefined
		const flow =
			interactive && typeof interactive !== 'string' && Array.isArray(interactive.content)
				? interactive.content[0]
				: undefined
		expect(flow && typeof flow !== 'string' ? flow.attrs.name : undefined).toBe('cta_catalog')
	})

	it('marks business and interactive node payloads for binary filtering', () => {
		expect(getBinaryNodeFilter([{ tag: 'biz', attrs: {} }])).toBe(true)
		expect(
			getBinaryNodeFilter([
				{
					tag: 'message',
					attrs: {},
					content: [{ tag: 'interactive', attrs: {}, content: [{ tag: 'native_flow', attrs: {} }] }]
				}
			])
		).toBe(true)
		expect(getBinaryNodeFilter([{ tag: 'message', attrs: {}, content: [{ tag: 'body', attrs: {} }] }])).toBe(false)
		expect(getBinaryNodeFilter(undefined)).toBe(false)
	})

	it('exports the minimum upload interval constant', () => {
		expect(MIN_UPLOAD_INTERVAL).toBe(5000)
	})
})
