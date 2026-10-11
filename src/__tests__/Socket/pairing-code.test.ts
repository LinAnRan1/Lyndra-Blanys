import { WebSocketServer } from 'ws'
import makeWASocket from '../../Socket'
import { initAuthCreds } from '../../Utils'

const silent: any = {
	level: 'silent',
	child: () => silent,
	trace() {},
	debug() {},
	info() {},
	warn() {},
	error() {},
	fatal() {}
}

describe('requestPairingCode', () => {
	let wss: WebSocketServer
	let url: string
	const socks: ReturnType<typeof makeWASocket>[] = []

	beforeAll(async () => {
		wss = new WebSocketServer({ port: 0 })
		await new Promise(r => wss.on('listening', r))
		url = `ws://127.0.0.1:${(wss.address() as any).port}`
	})

	afterAll(async () => {
		for (const s of socks) s.end(undefined)
		wss.close()
	})

	const make = (registered = false) => {
		const creds = initAuthCreds()
		creds.registered = registered
		const sock = makeWASocket({
			auth: { creds, keys: { get: async () => ({}), set: async () => {} } as any },
			logger: silent,
			waWebSocketUrl: url,
			printQRInTerminal: false
		} as any)
		socks.push(sock)
		return { sock, creds }
	}

	it('rejects invalid phone numbers', async () => {
		const { sock } = make()
		await expect(sock.requestPairingCode('abc')).rejects.toThrow(/Invalid phone number/)
		await expect(sock.requestPairingCode('123')).rejects.toThrow(/Invalid phone number/)
	})

	it('rejects custom codes that are not exactly 8 letters/digits', async () => {
		const { sock } = make()
		await expect(sock.requestPairingCode('6281234567890', 'DENIA6969')).rejects.toThrow(/exactly 8/)
		await expect(sock.requestPairingCode('6281234567890', 'AB-CD-12')).rejects.toThrow(/exactly 8/)
	})

	it('refuses when the session is already registered', async () => {
		const { sock } = make(true)
		await expect(sock.requestPairingCode('6281234567890')).rejects.toThrow(/already registered/)
	})

	it('waits for the socket, normalizes the phone and returns the custom code uppercased', async () => {
		const { sock, creds } = make()
		const code = await sock.requestPairingCode('+62 812-3456-7890', 'denia696')
		expect(code).toBe('DENIA696')
		expect(creds.pairingCode).toBe('DENIA696')
		expect(creds.me?.id).toBe('6281234567890@s.whatsapp.net')
	})

	it('generates a random 8-char code when no custom code is given', async () => {
		const { sock } = make()
		const code = await sock.requestPairingCode('6281234567890')
		expect(code).toMatch(/^[0-9A-Z]{8}$/)
	})
})
