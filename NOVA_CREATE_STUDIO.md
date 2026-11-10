# NOVA Create Studio — Images and real GLB starter files

NOVA includes **🖼 Generate image** and **⬡ Make GLB model** beneath the chat composer. You can also type requests such as "Generate a picture of a modern red SUV" or "Make a GLB model of a parking garage" and NOVA opens the appropriate creator.

## Image generation — Cloudflare Workers AI

NOVA calls the existing authenticated **/api/image** endpoint, which runs the Cloudflare-hosted model `@cf/black-forest-labs/flux-1-schnell`:

- Describe a car, building, person, landscape, wallpaper, concept, or other suitable subject.
- Choose realistic, game render, cinematic, concept art, cartoon or blueprint.
- Choose square, wide 16:9, or portrait 9:16. The underlying model generates a standard image; NOVA **center-crops** for wide/portrait, so edges can be lost.
- Select **Generate image**. The result appears in Create Studio and in the current chat.
- Choose **Download JPG** to keep it. Large images are **not** saved in D1 memory or backed up with your local chat history. Chat previews exist only for the current session.

**Setup required**: Deploy the newest Cloudflare Worker and configure its **AI** binding and private **NOVA_PASSCODE** Worker secret. On NOVA's Settings page enter the same passcode. Cloudflare image generation consumes the provider's AI quota; it is not unlimited and may require accepting model terms depending on account. No external image-provider API key is needed for the Cloudflare-hosted FLUX.1 schnell model.

Official reference: https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/

## GLB model generation — runs offline

Click **⬡ Make GLB model**. Provide a description such as:
- `2019 SUV with dark windows, wheels and a long roof`
- `double-bay parking garage with ramps and guardrails`
- `modern home with windows and a door`
- `human mannequin with a head, torso, arms and legs`
- `tree with branches and a canopy`
- `chair, table or lamp for a Roblox environment`

Choose the asset type or Automatic. NOVA produces a real **glTF 2.0 binary (.glb)** with vertices, normals, triangle indices, PBR colors, a scene hierarchy, named components and transforms. It can be imported into Blender and many game engines, including engines that support glTF/GLB. Download the **asset specifications JSON** separately.

The **schematic preview** shows a rough view of the parts; you can drag it to rotate. It is not a full real-time 3D GLB renderer.

**The default GLB generator is completely free and runs on your device.** It does not require internet access, API keys, or 3D cloud services after the app has loaded.

### Optional NOVA Pro parts planning

In GLB mode, check **Ask hosted AI to arrange custom parts** to let NOVA Pro propose parts beyond the six default asset categories. It calls the authenticated **/api/3d-plan** endpoint, spends Workers AI allocation, and returns a validated list of boxes, cylinders and spheres. Your device builds and exports the GLB. Uncheck the option when Cloudflare is unavailable.

No arbitrary executable code is run from the AI-generated plan. Primitive counts, dimensions, material names and coordinates are bounded before model export.

### What this is not

- Not an unlimited high-detail, one-prompt text-to-3D neural generator.
- No photogrammetry, automatic UV unwrapping, textures, detailed car interiors, faithful brand geometry, skeletal rigging, animation or perfect blueprint reconstruction.
- A starter geometry file and concept planning tool, intended as a base for refinement in Blender or your game pipeline.
- Image and GLB files generated during the session are **not** stored in Cloudflare D1. Download them.

## Testing and deployment

GitHub Actions runs:

```sh
node tests/nova_image.cjs
node tests/nova_3d.cjs
node tests/nova_create.cjs
node tests/nova_3d_plan.cjs
```

The image/AI tests use mocks and **do not** spend Cloudflare credits. GLB tests generate and validate actual glTF 2.0 binary structure. GitHub Actions passing does not confirm the owner's Cloudflare account is connected.

1. Open https://exclusive2knight.github.io/NOVA-AI/ after the GitHub Pages build finishes.
2. The **⬡ Make GLB model** function works on the website itself.
3. To activate image generation and custom AI planning, deploy the latest Worker via the [Cloudflare deployment workflow](CLOUDFLARE_AUTO_DEPLOY_SETUP.md).
4. Test with a small image prompt and a simple GLB prompt.
5. Download generated files before refreshing.

The public NOVA website and Cloudflare Worker are separate deployments. Connecting your private account once is necessary and cannot be done by pushing code alone.
