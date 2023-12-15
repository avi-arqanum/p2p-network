import { createLibp2p } from "libp2p";

import { webSockets } from "@libp2p/websockets";
import { webRTC } from "@libp2p/webrtc";

import { bootstrap } from "@libp2p/bootstrap";
import { kadDHT } from "@libp2p/kad-dht";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";

const bootstrapMultiaddrs = [
	"/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
	"/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
	// "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
];

async function createNode() {
	const node = await createLibp2p({
		addresses: {
			listen: [
				"/ip4/127.0.0.1/tcp/8000/ws",
				"/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
			],
		},
		transports: [webRTC(), webSockets()],
		services: {
			pubsub: gossipsub({ emitSelf: true }),
		},
		peerDiscovery: [
			bootstrap({
				list: bootstrapMultiaddrs,
			}),
			kadDHT(),
		],
		connectionEncryption: [noise()],
		streamMuxers: [mplex()],
	});

	await node.start();

	const listeningAddrs = node.getMultiaddrs();
	console.log(listeningAddrs);

	node.addEventListener("peer:discovery", (event) => {
		console.log(event.detail);
	});

	node.services.pubsub.subscribe("fruit");
	node.services.pubsub.publish("fruit", "banana");

	node.services.pubsub.addEventListener("message", (event) => {
		console.log(event.detail.topic, event.detail.data);
	});
}

createNode();
