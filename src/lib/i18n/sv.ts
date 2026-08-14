export const sv = {
	appName: 'Tit’s Pantry',
	nav: {
		smart: 'Smart sökning',
		unpack: 'Packa upp',
		list: 'Inköpslista',
		bulk: 'Massredigera',
		settings: 'Inställningar'
	},
	command: {
		placeholder: 'Skanna streckkod eller sök produkt',
		hint: 'Fältet är alltid i fokus. Skannern skickar Enter.'
	},
	actions: {
		consume: 'Ta ut',
		add: 'Lägg in',
		inventory: 'Inventera',
		shopping: 'Inköpslista',
		create: 'Skapa produkt',
		save: 'Spara',
		cancel: 'Avbryt',
		test: 'Testa anslutning',
		apply: 'Spara ändringar',
		select: 'Välj'
	},
	smart: {
		title: 'Smart sökning',
		lead: 'Skanna eller skriv. Vid en tydlig träff körs standardåtgärden efter tidsgränsen.',
		unknown: 'Okänd streckkod',
		ambiguous: 'Flera träffar — välj en produkt',
		parentPick: 'Föräldraprodukt utan eget lager — välj en underprodukt',
		timeoutCancel: 'Tidsgränsen gick ut. Inget ändrades.',
		consumed: 'Tog ut {amount} {name}',
		added: 'Lade in {amount} {name}',
		shopped: 'Lade {name} på inköpslistan',
		inventoryStub: 'Inventering kommer i en senare version.',
		stock: 'I lager: {amount}',
		noStock: 'Inte i lager'
	},
	unpack: {
		title: 'Packa upp',
		lead: 'Skanna varor när du packar upp kassarna. Standardåtgärd är att lägga in i lager.',
		updateDefaultLocation: 'Uppdatera standardplats',
		recent: 'Senast inlagda'
	},
	create: {
		title: 'Ny produkt',
		fromLookup: 'Uppgifter från Grocy/Open Food Facts. Komplettera det som saknas.',
		noLookup: 'Ingen träff i streckkodsuppslag. Fyll i uppgifterna.',
		name: 'Namn',
		location: 'Plats',
		purchaseUnit: 'Inköpsenhet',
		stockUnit: 'Lagerenhet',
		proposeAdd: 'Produkten är skapad. Vill du lägga in den i lager?'
	},
	list: {
		title: 'Inköpslista',
		empty: 'Inköpslistan är tom.',
		emptyHint: 'Lägg till varor från smart sökning.',
		done: 'Klar'
	},
	bulk: {
		title: 'Massredigera',
		lead: 'Gruppera varumärken under en föräldraprodukt. Grocy stödjer bara en nivå.',
		filter: 'Filter',
		all: 'Alla',
		orphans: 'Föräldralösa',
		byParent: 'Efter förälder',
		parent: 'Förälder',
		noOwnStock: 'Inget eget lager',
		none: 'Ingen',
		selected: '{count} valda',
		setParent: 'Sätt förälder',
		setNoOwnStock: 'Sätt “inget eget lager”',
		clearParent: 'Ta bort förälder',
		saved: 'Uppdaterade {count} produkter',
		search: 'Sök produkter'
	},
	settings: {
		title: 'Inställningar',
		lead: 'API-nyckel och adress sparas bara i den här webbläsaren.',
		url: 'Grocy-adress',
		urlHint: 'Till exempel https://grocy.example eller http://127.0.0.1:9283',
		apiKey: 'API-nyckel',
		apiKeyHint: 'Skapas per användare i Grocy under Hantera API-nycklar.',
		timeout: 'Tidsgräns (sekunder)',
		timeoutHint: 'Hur länge åtgärdspanelen visas innan standardåtgärden körs.',
		autoExecute: 'Kör standardåtgärd automatiskt',
		autoExecuteHint:
			'När detta är av krävs att du trycker på knappen själv. Tidsgränsen gäller fortfarande för oklara träffar.',
		mixedContent: 'Sidan körs över HTTPS men Grocy-adressen är HTTP. Webbläsaren kommer att blockera anropen.',
		localProxy: 'HTTP-Grocy på localhost går via Vite-proxyn i utvecklingsläge, så webbläsaren inte blockerar anropet.',
		localHttp: 'HTTP-Grocy på localhost kräver npm run dev. Webbläsaren blockerar annars anropet (CORS / Local Network Access).',
		saved: 'Inställningarna är sparade.',
		connected: 'Ansluten till Grocy {version}',
		connectFailed: 'Kunde inte ansluta. Kontrollera adress, nyckel och CORS.'
	},
	errors: {
		notConfigured: 'Ange Grocy-adress och API-nyckel under Inställningar.',
		unknownBarcode: 'Streckkoden finns inte i Grocy.',
		noProduct: 'Ingen produkt hittades.',
		requestFailed: 'Grocy svarade {status}',
		requestFailedDetail: 'Grocy svarade {status}: {detail}',
		unauthorized: 'Grocy avvisade API-nyckeln (401). Kontrollera att nyckeln tillhör den instansen.',
		mixedContent: 'Webbläsaren blockerar HTTP-Grocy från en HTTPS-sida.',
		localHttp: 'Webbläsaren blockerar HTTP-Grocy på localhost. Använd npm run dev, eller 127.0.0.1 i stället för localhost.',
		cors: 'Webbläsaren blockerade anropet (CORS). Kontrollera att Grocy tillåter din origin.'
	}
} as const;

export function format(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
