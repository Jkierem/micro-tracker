ROOT_DIR=$(git rev-parse --show-toplevel)
PROTO_DIR="${ROOT_DIR}/leishmaniapp"
OUT_DIR="${ROOT_DIR}/src/adapters/leishmaniapp/client"

rm -rf "${OUT_DIR}"
mkdir "${OUT_DIR}"

protoc \
  --proto_path="${PROTO_DIR}" \
  --js_out=import_style=commonjs,binary:$OUT_DIR \
  --grpc-web_out=import_style=typescript,mode=grpcweb:$OUT_DIR \
  "${PROTO_DIR}/*.proto"