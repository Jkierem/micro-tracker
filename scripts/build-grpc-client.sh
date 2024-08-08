ROOT_DIR=$(git rev-parse --show-toplevel)
PROTO_DIR="${ROOT_DIR}/leishmaniapp"
OUT_DIR="${ROOT_DIR}/src/adapters/leishmaniapp/client"

rm -rf "${OUT_DIR}"
mkdir "${OUT_DIR}"

protoc \
    --ts_opt=esModuleInterop=true \
    --ts_out="${OUT_DIR}" \
    --proto_path="${PROTO_DIR}" \
    "${PROTO_DIR}/*.proto"