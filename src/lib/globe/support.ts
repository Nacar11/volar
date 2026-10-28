/** Whether this browser can draw the 3D globe; without WebGL the flat map stands in. */
export function hasWebGL(): boolean {
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
		gl?.getExtension('WEBGL_lose_context')?.loseContext();
		return gl !== null;
	} catch {
		return false;
	}
}
