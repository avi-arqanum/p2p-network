import { createLibp2p } from "libp2p";

import { webSockets } from "@libp2p/websockets";
import { webRTC } from "@libp2p/webrtc";

import { bootstrap } from "@libp2p/bootstrap";
import { kadDHT } from "@libp2p/kad-dht";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";

import { delegatedPeerRouting } from "@libp2p/delegated-peer-routing";
import { create as kuboClient } from "kubo-rpc-client";

const client = kuboClient({
	protocol: "https",
	port: 443,
	host: "node0.delegate.ipfs.io",
});

const bootstrapMultiaddrs = [
	"/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
	"/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
	// "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
];

const listeningAddrs = [
	"/ip4/127.0.0.1/tcp/8000/ws",
	"/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
];

async function createNode() {
	const node = await createLibp2p({
		addresses: {
			listen: listeningAddrs,
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
		peerRouters: [delegatedPeerRouting(client)],
		connectionEncryption: [noise()],
		streamMuxers: [mplex()],
	});

	await node.start();


	console.log('My peerId is: ', node.peerId);


	const advertisingAddrs = node.getMultiaddrs();
	console.log("Node is listening on addresses: ", advertisingAddrs);

	console.log("new bootstrap-peers discovered: ");
	node.addEventListener("peer:discovery", (event) => {
		console.log(event.detail);
	});



	try {
		const peerInfo = await node.peerRouting.findPeer("12D3KooWLCne4Fd1sJ5ALtMZnGvoCj9uozDEFJLznG7rtpV3Hnjk");
		console.log("peer discovered via peer-routing", peerInfo);
	} catch (error) {
		console.log("peer not found");
	}



	node.services.pubsub.subscribe("fruit");
	node.services.pubsub.publish("fruit", "banana");

	node.services.pubsub.addEventListener("message", (event) => {
		console.log(event.detail.topic, event.detail.data);
	});
}

createNode();

export default createNode;