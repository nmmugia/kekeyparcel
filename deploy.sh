tar -cvf final.tar .next/
scp -i ../test.pem ./final.tar ec2-user@3.1.203.169:/home/ec2-user/
