#!/bin/bash

curl -X POST http://127.0.0.1:8000/estimate -F 'image_file=@test_image.jpg;type=image/jpeg'