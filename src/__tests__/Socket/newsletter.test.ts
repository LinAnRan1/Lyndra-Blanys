import { jest } from '@jest/globals'
import type { SocketConfig } from '../../Types'
import { QueryIds, XWAPaths } from '../../Types'

const mockQuery = jest.fn()
const mockGenerateMessageTag = jest.fn(() => 'test-tag')
const mockExecuteWMexQuery = jest.fn<(...args: unknown[]) => Promise<unknown>>(async () => undefined)

jest.unstable_mockModule('../../Socket/groups', () => ({
	makeGroupsSocket: jest.fn(() => ({
		query: mockQuery,
		generateMessageTag: mockGenerateMessageTag
	}))
}))

jest.unstable_mockModule('../../Socket/mex', () => ({
	executeWMexQuery: mockExecuteWMexQuery
}))

const { makeNewsletterSocket } = await import('../../Socket/newsletter')

describe('newsletterMultipleFollow', () => {
	afterEach(() => {
		jest.useRealTimers()
		jest.clearAllMocks()
	})

	it('follows whitespace-separated newsletter IDs with the expected query and delay', async () => {
		jest.useFakeTimers()
		const socket = makeNewsletterSocket({} as SocketConfig)
		const pending = socket.newsletterMultipleFollow('first@newsletter  second@newsletter\n')

		await jest.advanceTimersByTimeAsync(1100)
		await expect(pending).resolves.toBeUndefined()

		expect(mockExecuteWMexQuery).toHaveBeenNthCalledWith(
			1,
			{ newsletter_id: 'first@newsletter' },
			QueryIds.FOLLOW,
			XWAPaths.xwa2_newsletter_follow,
			mockQuery,
			mockGenerateMessageTag
		)
		expect(mockExecuteWMexQuery).toHaveBeenNthCalledWith(
			2,
			{ newsletter_id: 'second@newsletter' },
			QueryIds.FOLLOW,
			XWAPaths.xwa2_newsletter_follow,
			mockQuery,
			mockGenerateMessageTag
		)
	})

	it('propagates a rejected follow request', async () => {
		const error = new Error('newsletter follow rejected')
		mockExecuteWMexQuery.mockRejectedValueOnce(error)
		const socket = makeNewsletterSocket({} as SocketConfig)

		await expect(socket.newsletterMultipleFollow('first@newsletter')).rejects.toBe(error)
	})

	it('fetches the subscribed newsletter list through the Ourin query', async () => {
		const response = { subscribed: ['1200@newsletter'] }
		mockExecuteWMexQuery.mockResolvedValueOnce(response)
		const socket = makeNewsletterSocket({} as SocketConfig)

		await expect(socket.newsletterFetchAllSubscribe()).resolves.toBe(response)
		expect(mockExecuteWMexQuery).toHaveBeenCalledWith(
			{},
			'6388546374527196',
			'xwa2_newsletter_subscribed',
			mockQuery,
			mockGenerateMessageTag
		)
	})

	it('uses the requested action name in the newsletter MEX query', async () => {
		const socket = makeNewsletterSocket({} as SocketConfig)

		await socket.newsletterAction('1200@newsletter', 'FOLLOW')

		expect(mockExecuteWMexQuery).toHaveBeenCalledWith(
			{ newsletter_id: '1200@newsletter' },
			'FOLLOW',
			'xwa2_newsletter_follow',
			mockQuery,
			mockGenerateMessageTag
		)
	})

	it('resolves a channel invite URL into typed newsletter metadata', async () => {
		mockExecuteWMexQuery.mockResolvedValueOnce({
			id: '1200@newsletter',
			state: { type: 'ACTIVE' },
			thread_metadata: {
				creation_time: '1700000000',
				name: { text: 'Channel' },
				description: { text: 'Description' },
				invite: 'invite-key',
				picture: { direct_path: '/picture' },
				preview: { direct_path: '/preview' },
				subscribers_count: '42',
				verification: 'VERIFIED'
			},
			viewer_metadata: { role: 'GUEST' }
		})
		const socket = makeNewsletterSocket({} as SocketConfig)

		const metadata = await socket.cekIDSaluran('https://whatsapp.com/channel/invite-key?source=copy')

		expect(mockExecuteWMexQuery).toHaveBeenCalledWith(
			{
				input: { key: 'invite-key', type: 'INVITE', view_role: 'GUEST' },
				fetch_viewer_metadata: true,
				fetch_full_image: true,
				fetch_creation_time: true
			},
			QueryIds.METADATA,
			XWAPaths.xwa2_newsletter_metadata,
			mockQuery,
			mockGenerateMessageTag
		)
		expect(metadata).toMatchObject({
			id: '1200@newsletter',
			state: 'ACTIVE',
			creation_time: 1700000000,
			name: 'Channel',
			description: 'Description',
			invite: 'invite-key',
			subscribers: 42,
			verification: 'VERIFIED',
			viewer_metadata: { role: 'GUEST' }
		})
		expect(metadata.picture).toContain('/picture')
		expect(metadata.preview).toContain('/preview')
	})
})
